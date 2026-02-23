import { z } from 'zod'
import { eq, and, lt, sql } from 'drizzle-orm'

import { db } from '#/db'
import { documents, documentTranslations } from '#/db/schema'
import { searchWeb, generateStructured } from '#/lib/ai'
import { inngest } from '#/lib/inngest'

// -- Schemas --

const UpdateComparisonSchema = z.object({
  hasSignificantUpdates: z.boolean(),
  updatedSections: z.array(
    z.object({
      sectionIndex: z.number().int().nonnegative(),
      newContent: z.string(),
      reason: z.string(),
    }),
  ),
})

// -- Function A: Weekly cron to find stale documents and fan out refresh events --

export const checkStaleDocuments = inngest.createFunction(
  { id: 'check-stale-documents' },
  { cron: '0 0 * * 0' },
  async ({ step }) => {
    const staleDocuments = await step.run('find-stale-documents', async () => {
      return db
        .select({ id: documents.id, topic: documents.topic })
        .from(documents)
        .where(
          and(
            lt(documents.staleAt, sql`now()`),
            eq(documents.status, 'verified'),
          ),
        )
    })

    if (staleDocuments.length === 0) {
      return { refreshed: 0 }
    }

    await step.sendEvent(
      'fan-out-refresh',
      staleDocuments.map((doc) => ({
        name: 'document/refresh.requested' as const,
        data: { documentId: doc.id },
      })),
    )

    return { refreshed: staleDocuments.length }
  },
)

// -- Function B: Per-document refresh triggered by fan-out event --

export const refreshDocument = inngest.createFunction(
  { id: 'refresh-document' },
  { event: 'document/refresh.requested' },
  async ({ event, step }) => {
    const { documentId } = event.data

    const document = await step.run('load-document', async () => {
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1)

      if (!doc) throw new Error(`Document not found: ${documentId}`)
      if (!doc.content) throw new Error(`Document has no content: ${documentId}`)

      return doc
    })

    // Step 1: Re-research the topic with fresh web searches
    const research = await step.run('research', async () => {
      const queries = [
        `${document.topic} latest information`,
        `${document.topic} recent updates`,
        `${document.topic} current status`,
      ]

      const results = await Promise.all(
        queries.map(async (query) => {
          const response = await searchWeb(query, { numResults: 4 })
          return response.results.map((r) => ({
            url: r.url ?? '',
            title: r.title ?? 'Untitled',
            text: (r.text ?? '').slice(0, 2000),
          }))
        }),
      )

      const deduped = new Map<string, { url: string; title: string; text: string }>()
      for (const resultSet of results) {
        for (const result of resultSet) {
          if (result.url && !deduped.has(result.url)) {
            deduped.set(result.url, result)
          }
        }
      }

      return Array.from(deduped.values()).slice(0, 15)
    })

    // Step 2: Compare existing content with new research
    const comparison = await step.run('compare', async () => {
      const sections = (document.content ?? '').split(/^(?=## )/m).filter(Boolean)

      return generateStructured(
        UpdateComparisonSchema,
        [
          'You are a fact-checking editor.',
          'Compare existing document sections against new research findings.',
          'Only flag sections where the research reveals factual changes, corrections, or significant new information.',
          'Do not flag sections for minor wording differences or stylistic preferences.',
          'Do not use em-dashes in your output.',
        ].join(' '),
        [
          'Existing document sections (indexed from 0):',
          ...sections.map((s, i) => `--- Section ${i} ---\n${s.trim()}`),
          '',
          'New research findings:',
          JSON.stringify(research, null, 2),
          '',
          'Determine if any sections need updating based on the new research.',
          'For each section that needs changes, provide the full updated section content (including the ## heading) and a brief reason.',
        ].join('\n'),
        'update_comparison',
      )
    })

    // No significant updates found, just reset the stale timer
    if (!comparison.hasSignificantUpdates || comparison.updatedSections.length === 0) {
      await step.run('reset-stale-timer', async () => {
        await db
          .update(documents)
          .set({
            staleAt: sql`now() + interval '30 days'`,
            updatedAt: sql`now()`,
          })
          .where(eq(documents.id, documentId))
      })

      return { documentId, updated: false }
    }

    // Step 3: Merge updated sections into document
    await step.run('update', async () => {
      const sections = (document.content ?? '').split(/^(?=## )/m).filter(Boolean)

      for (const update of comparison.updatedSections) {
        if (update.sectionIndex >= 0 && update.sectionIndex < sections.length) {
          sections[update.sectionIndex] = update.newContent
        }
      }

      const updatedContent = sections.map((s) => s.trim()).join('\n\n')

      await db
        .update(documents)
        .set({
          content: updatedContent,
          status: 'generated',
          staleAt: sql`now() + interval '30 days'`,
          updatedAt: sql`now()`,
        })
        .where(eq(documents.id, documentId))
    })

    // Step 4: Re-verify the updated document
    await step.sendEvent('re-verify', {
      name: 'document/verification.requested',
      data: { documentId },
    })

    // Step 5: Re-translate existing translations
    const existingTranslations = await step.run('find-translations', async () => {
      return db
        .select({ locale: documentTranslations.locale })
        .from(documentTranslations)
        .where(eq(documentTranslations.documentId, documentId))
    })

    if (existingTranslations.length > 0) {
      await step.sendEvent(
        're-translate',
        existingTranslations.map((t) => ({
          name: 'document/translation.requested' as const,
          data: { documentId, targetLocale: t.locale },
        })),
      )
    }

    return {
      documentId,
      updated: true,
      sectionsUpdated: comparison.updatedSections.length,
    }
  },
)
