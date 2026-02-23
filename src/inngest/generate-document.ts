import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { documents } from '#/db/schema'
import { AI_MODEL, generateStructured, searchWeb } from '#/lib/ai'
import { inngest } from '#/lib/inngest'

const SourceSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  snippet: z.string(),
})

const OutlineSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      keyPoints: z.array(z.string()),
    }),
  ),
  estimatedLength: z.number().int().positive(),
})

const DraftSchema = z.object({
  sections: z.array(
    z.object({
      heading: z.string(),
      body: z.string(),
    }),
  ),
})

type Source = z.infer<typeof SourceSchema>

const WRITER_SYSTEM_PROMPT =
  'You are an encyclopedic writer. Write in neutral, factual tone. Use short, clear sentences. Cite sources inline as [1], [2]. Do not use em-dashes. Do not use marketing language or superlatives unless directly sourced.'

export const generateDocument = inngest.createFunction(
  { id: 'generate-document', idempotency: 'event.data.documentId + "-" + event.data.locale' },
  { event: 'document/generation.requested' },
  async ({ event, step }) => {
    const { topic, locale, documentId } = event.data

    const research = await step.run('research', async () => {
      const queries = [
        `${topic} overview`,
        `${topic} key facts`,
        `${topic} recent developments`,
        `${topic} evidence and data`,
        `${topic} expert consensus`,
      ]

      const queryResults = await Promise.all(
        queries.map(async (query) => {
          const response = await searchWeb(query, { numResults: 4 })
          return response.results.map((result) => ({
            query,
            url: result.url ?? '',
            title: result.title ?? 'Untitled source',
            snippet: (result.text ?? '').slice(0, 500),
          }))
        }),
      )

      const deduped = new Map<string, Source>()
      for (const resultSet of queryResults) {
        for (const result of resultSet) {
          if (!result.url || deduped.has(result.url)) {
            continue
          }

          const parsed = SourceSchema.safeParse({
            url: result.url,
            title: result.title,
            snippet: result.snippet,
          })

          if (parsed.success) {
            deduped.set(parsed.data.url, parsed.data)
          }
        }
      }

      return {
        queries,
        sources: Array.from(deduped.values()).slice(0, 20),
      }
    })

    const outline = await step.run('outline', async () => {
      return generateStructured(
        OutlineSchema,
        WRITER_SYSTEM_PROMPT,
        [
          `Model: ${AI_MODEL}`,
          `Locale: ${locale}`,
          `Topic: ${topic}`,
          'Create a clear, encyclopedic outline grounded in the provided research sources.',
          'Return 5 to 8 sections with concrete key points.',
          'Research sources:',
          JSON.stringify(research.sources, null, 2),
        ].join('\n\n'),
        'document_outline',
      )
    })

    const draft = await step.run('draft', async () => {
      return generateStructured(
        DraftSchema,
        WRITER_SYSTEM_PROMPT,
        [
          `Model: ${AI_MODEL}`,
          `Locale: ${locale}`,
          `Topic: ${topic}`,
          `Document title: ${outline.title}`,
          'Write section bodies in Markdown. Keep claims factual and cite sources inline as [n].',
          'Do not include a top-level document title heading in section bodies.',
          'Outline:',
          JSON.stringify(outline, null, 2),
          'Research sources with indices:',
          JSON.stringify(
            research.sources.map((source, index) => ({
              index: index + 1,
              ...source,
            })),
            null,
            2,
          ),
        ].join('\n\n'),
        'document_draft',
      )
    })

    const assembledDocument = await step.run('assemble', async () => {
      const sectionLookup = new Map(draft.sections.map((section) => [section.heading, section.body]))
      const orderedSections = outline.sections.map((section) => {
        const body = sectionLookup.get(section.heading)
        return `## ${section.heading}\n\n${body ?? ''}`.trim()
      })

      const sourceList = research.sources
        .map((source, index) => `${index + 1}. ${source.url}`)
        .join('\n')

      const markdown = [`# ${outline.title}`, ...orderedSections, '## Sources', sourceList].join('\n\n')

      return {
        title: outline.title,
        content: markdown,
        sources: research.sources,
      }
    })

    await step.run('save', async () => {
      await db
        .update(documents)
        .set({
          content: assembledDocument.content,
          title: assembledDocument.title,
          status: 'generated',
          sources: assembledDocument.sources,
        })
        .where(eq(documents.id, documentId))

      return { documentId }
    })

    await step.sendEvent('fan-out-verification', {
      name: 'document/verification.requested',
      data: { documentId, locale },
    })

    return {
      documentId,
      title: assembledDocument.title,
      sourceCount: assembledDocument.sources.length,
    }
  },
)
