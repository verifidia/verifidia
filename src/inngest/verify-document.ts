import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db'
import { documents } from '#/db/schema'
import { generateStructured, searchWeb } from '#/lib/ai'
import { inngest } from '#/lib/inngest'

const claimExtractionSchema = z.object({
  claims: z.array(
    z.object({
      text: z.string(),
      sectionIndex: z.number(),
      confidence: z.enum(['high', 'medium', 'low']),
    })
  ),
})

const crossReferenceSchema = z.object({
  overallScore: z.number(),
  flaggedClaims: z.array(
    z.object({
      claimIndex: z.number(),
      issue: z.string(),
      severity: z.enum(['critical', 'warning', 'info']),
    })
  ),
  summary: z.string(),
})

const SOURCE_BATCH_SIZE = 5

interface SourceVerificationResult {
  claimIndex: number
  notes: string
  sources: string[]
  verified: boolean
}

function parseSourceUrls(rawSources: unknown): string[] {
  if (!Array.isArray(rawSources)) {
    return []
  }

  return rawSources
    .map((source) => {
      if (typeof source === 'string') {
        return source
      }
      if (source && typeof source === 'object' && 'url' in source) {
        const maybeUrl = (source as { url?: unknown }).url
        return typeof maybeUrl === 'string' ? maybeUrl : null
      }
      return null
    })
    .filter((url): url is string => Boolean(url))
}

export const verifyDocument = inngest.createFunction(
  {
    id: 'verify-document',
    idempotency: 'event.data.documentId + "-" + event.data.locale',
    concurrency: { limit: 3 },
  },
  { event: 'document/verification.requested' },
  async ({ event, step }) => {
    const loadedDocument = await step.run('load-document', async () => {
      const [document] = await db
        .select({
          id: documents.id,
          content: documents.content,
          sources: documents.sources,
        })
        .from(documents)
        .where(eq(documents.id, event.data.documentId))
        .limit(1)

      if (!document) {
        throw new Error(`Document not found: ${event.data.documentId}`)
      }

      if (!document.content || document.content.trim().length === 0) {
        throw new Error(`Document has no content: ${event.data.documentId}`)
      }

      return {
        documentId: document.id,
        content: document.content,
        sourceUrls: parseSourceUrls(document.sources),
      }
    })

    const extractionResult = await step.run('claim-extraction', () => {
      const systemPrompt = [
        'You extract verifiable factual claims from documents.',
        'Return only claims that are objective and can be supported or contradicted with evidence.',
        'Avoid opinions, value judgments, and broad rhetorical statements.',
      ].join(' ')

      const userPrompt = [
        'Extract all factual claims from this document. Each claim should be a single verifiable statement.',
        'Assign a sectionIndex based on reading order, starting at 0.',
        'Set confidence based on how explicit the claim is in the text.',
        '',
        'Document content:',
        loadedDocument.content,
      ].join('\n')

      return generateStructured(
        claimExtractionSchema,
        systemPrompt,
        userPrompt,
        'claim_extraction'
      )
    })

    const verificationResults: SourceVerificationResult[] = []
    const { claims } = extractionResult

    for (let start = 0; start < claims.length; start += SOURCE_BATCH_SIZE) {
      const end = Math.min(start + SOURCE_BATCH_SIZE, claims.length)
      const batch = claims.slice(start, end)

      const batchResults = await step.run(
        `source-verification-batch-${Math.floor(start / SOURCE_BATCH_SIZE) + 1}`,
        () => {
          return Promise.all(
            batch.map(async (claim, batchIndex) => {
              const claimIndex = start + batchIndex
              const query = [
                claim.text,
                ...loadedDocument.sourceUrls.slice(0, 3),
              ].join(' ')

              const search = await searchWeb(query, { numResults: 5 })
              const urls = (search.results ?? [])
                .map((result) => result.url)
                .filter(
                  (url): url is string =>
                    typeof url === 'string' && url.length > 0
                )

              const notes =
                urls.length > 0
                  ? `Found ${urls.length} potentially relevant sources`
                  : 'No supporting sources found from web search'

              return {
                claimIndex,
                verified: urls.length > 0,
                sources: urls,
                notes,
              }
            })
          )
        }
      )

      verificationResults.push(...batchResults)
    }

    const crossReference = await step.run('cross-reference', () => {
      const systemPrompt = [
        'You are a strict verification analyst.',
        'Evaluate evidence quality, identify unsupported claims, and note contradictions.',
        'Score conservatively when evidence is weak, sparse, or inconsistent.',
      ].join(' ')

      const userPrompt = [
        'Evaluate verification results. Flag claims that lack source support or have contradicting evidence.',
        'Return an overallScore from 0 to 100 as a whole number.',
        'For flaggedClaims, provide precise issues and severity based on evidence quality.',
        '',
        'Claims:',
        JSON.stringify(claims),
        '',
        'Verification results:',
        JSON.stringify(verificationResults),
      ].join('\n')

      return generateStructured(
        crossReferenceSchema,
        systemPrompt,
        userPrompt,
        'cross_reference'
      )
    })

    await step.run('update-status', async () => {
      const boundedScore = Math.max(
        0,
        Math.min(100, Math.round(crossReference.overallScore))
      )
      const status = boundedScore >= 70 ? 'verified' : 'flagged'

      await db
        .update(documents)
        .set({
          verificationScore: boundedScore,
          status,
          verificationDetails: {
            flaggedClaims: crossReference.flaggedClaims,
          },
        })
        .where(eq(documents.id, loadedDocument.documentId))
    })
  }
)
