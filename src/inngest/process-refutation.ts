import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import { documents, refutations } from '#/db/schema'
import { generateStructured, searchWeb } from '#/lib/ai'
import { inngest } from '#/lib/inngest'

const VerdictSchema = z.object({
  verdict: z.enum(['upheld', 'partially_upheld', 'rejected']),
  confidence: z.number().int().min(0).max(100),
  reasoning: z.string(),
  suggestedCorrection: z.string().nullable(),
  sources: z.array(
    z.object({
      url: z.string(),
      relevance: z.string(),
    })
  ),
})

const CATEGORY_CONTEXT: Record<string, string> = {
  factual_error: 'The user claims the text contains a factual inaccuracy.',
  outdated: 'The user claims the information is outdated or no longer current.',
  biased: 'The user claims the text exhibits bias or lacks neutrality.',
  missing_context:
    'The user claims important context is missing from this section.',
}

export const processRefutation = inngest.createFunction(
  {
    id: 'process-refutation',
    idempotency: 'event.data.documentId + "-" + event.data.locale',
  },
  { event: 'refutation/submitted' },
  async ({ event, step }) => {
    const { refutationId, documentId } = event.data

    const context = await step.run('load-context', async () => {
      const [refutation] = await db
        .select()
        .from(refutations)
        .where(eq(refutations.id, refutationId))
        .limit(1)

      if (!refutation) {
        throw new Error(`Refutation not found: ${refutationId}`)
      }

      const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1)

      if (!document?.content) {
        throw new Error(`Document not found or has no content: ${documentId}`)
      }

      const content = document.content
      const selectedIndex = content.indexOf(refutation.selectedText)
      const contextRadius = 500
      const sectionStart = Math.max(0, selectedIndex - contextRadius)
      const sectionEnd = Math.min(
        content.length,
        selectedIndex + refutation.selectedText.length + contextRadius
      )
      const sectionContent = content.slice(sectionStart, sectionEnd)

      await db
        .update(refutations)
        .set({ status: 'processing' })
        .where(eq(refutations.id, refutationId))

      return {
        refutation: {
          id: refutation.id,
          category: refutation.category,
          selectedText: refutation.selectedText,
          note: refutation.note,
          sourceUrl: refutation.sourceUrl,
          locale: refutation.locale,
        },
        sectionContent,
        documentContent: content,
      }
    })

    const researchResults = await step.run('research', async () => {
      const categoryHint = CATEGORY_CONTEXT[context.refutation.category] ?? ''
      const query = `${context.refutation.selectedText} ${categoryHint}`.trim()

      const results = await searchWeb(query, { numResults: 5 })

      return results.results.map((r) => ({
        url: r.url ?? '',
        title: r.title ?? 'Untitled',
        text: (r.text ?? '').slice(0, 2000),
      }))
    })

    const evaluation = await step.run('evaluate', () => {
      const categoryContext =
        CATEGORY_CONTEXT[context.refutation.category] ?? ''

      const userPrompt = [
        'Evaluate this refutation of an encyclopedic document.',
        `Category: ${context.refutation.category}. ${categoryContext}`,
        `The user claims the following text is problematic: '${context.refutation.selectedText}'.`,
        context.refutation.note
          ? `Their explanation: '${context.refutation.note}'.`
          : null,
        `Original section context: '${context.sectionContent}'.`,
        `Research findings: ${JSON.stringify(researchResults, null, 2)}.`,
        'Determine if the refutation has merit. Be rigorous and evidence-based.',
      ]
        .filter(Boolean)
        .join(' ')

      return generateStructured(
        VerdictSchema,
        [
          'You are a fact-checking evaluator for an encyclopedic knowledge platform.',
          'Evaluate refutations with rigor and neutrality.',
          'Base your verdict strictly on evidence, not assumptions.',
          'If the claim is correct, suggest a precise correction that fits the surrounding text.',
          'Never use em-dashes in your output. Use commas, semicolons, or separate sentences instead.',
        ].join(' '),
        userPrompt,
        'refutation_verdict'
      )
    })

    await step.run('update-refutation', async () => {
      await db
        .update(refutations)
        .set({
          verdict: evaluation.verdict,
          confidence: evaluation.confidence,
          reasoning: evaluation.reasoning,
          suggestedCorrection: evaluation.suggestedCorrection,
          researchSources: evaluation.sources,
          status: 'reviewed',
          resolvedAt: new Date(),
        })
        .where(eq(refutations.id, refutationId))

      return { refutationId, verdict: evaluation.verdict }
    })

    const applyResult = await step.run('apply-if-upheld', async () => {
      if (evaluation.verdict !== 'upheld' || evaluation.confidence <= 80) {
        return { applied: false }
      }
      if (!evaluation.suggestedCorrection) {
        return { applied: false }
      }
      const updatedContent = context.documentContent.replace(
        context.refutation.selectedText,
        evaluation.suggestedCorrection
      )

      await db
        .update(documents)
        .set({
          content: updatedContent,
          status: 'generated',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId))
      await db
        .update(refutations)
        .set({ status: 'applied' })
        .where(eq(refutations.id, refutationId))

      return { applied: true }
    })

    if (applyResult.applied) {
      await step.sendEvent('request-verification', {
        name: 'document/verification.requested',
        data: { documentId, locale: context.refutation.locale },
      })
      await step.sendEvent('request-translation', {
        name: 'document/translation.requested',
        data: {
          documentId,
          locale: context.refutation.locale,
          targetLocale: context.refutation.locale,
        },
      })
    }

    return {
      refutationId,
      documentId,
      verdict: evaluation.verdict,
      confidence: evaluation.confidence,
    }
  }
)
