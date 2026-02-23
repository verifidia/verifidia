import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import { documents } from '#/db/schema'
import { AI_MODEL, generateStructured, searchWeb } from '#/lib/ai'
import { inngest } from '#/lib/inngest'

// -- Schemas --

const SourceSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  snippet: z.string(),
})

const OutlineSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      purpose: z.string(),
      keyPoints: z.array(z.string()),
      searchQueries: z.array(z.string()),
    })
  ),
})

const SectionDraftSchema = z.object({
  body: z.string(),
})

type Source = z.infer<typeof SourceSchema>

interface SectionResearch {
  sectionIndex: number
  sources: Source[]
}

interface SectionDraft {
  body: string
  heading: string
  sectionIndex: number
  sources: Source[]
}

// -- Constants --

const SECTION_RESEARCH_BATCH_SIZE = 3

const ORCHESTRATOR_SYSTEM_PROMPT = [
  'You are an encyclopedic editor-in-chief planning comprehensive, Wikipedia-quality documents.',
  'Your outlines must be thorough, covering all major aspects of a topic from multiple angles.',
  'Each section should have a clear, distinct purpose with no overlap.',
  'Sections should flow logically from broad context to specific details.',
  'Do not use em-dashes.',
  'Do not use marketing language.',
  'Be neutral, rigorous, and comprehensive.',
].join(' ')

const SECTION_WRITER_SYSTEM_PROMPT = [
  'You are an encyclopedic section writer producing Wikipedia-quality content.',
  '',
  'Writing requirements:',
  '- Write in neutral, factual, academic but accessible prose.',
  '- Every factual claim MUST have an inline citation [n] referencing the provided numbered sources.',
  '- Aim for at least one citation every 1-2 sentences. Dense citations are expected.',
  '- Write 500 to 1000 words. Be thorough, detailed, and substantive.',
  '- Include specific data: statistics, dates, names, quantities, and measurements where the sources provide them.',
  '- Write flowing paragraphs. Do not use bullet lists or numbered lists.',
  '- You may use ### sub-headings within the section if the content warrants subdivision.',
  '- Cover multiple perspectives when the topic is debated or contested.',
  '- Do not use em-dashes. Use commas, semicolons, or separate sentences instead.',
  '- Do not use superlatives, hedging phrases, or marketing language.',
  '- Do not repeat information stated as being covered in other sections of the document.',
  '- Do not include the ## section heading in your output; it will be added automatically.',
  '- If a source does not support a claim, do not cite it for that claim.',
  '- Write in the locale specified. If the locale is not English, write the entire body in that language.',
].join('\n')

const CITATION_RE = /\[(\d+)\]/g

// -- Helpers --

function deduplicateSources(sourceLists: Source[][]): Source[] {
  const seen = new Map<string, Source>()
  for (const list of sourceLists) {
    for (const source of list) {
      if (source.url && !seen.has(source.url)) {
        seen.set(source.url, source)
      }
    }
  }
  return Array.from(seen.values())
}

function remapCitations(
  body: string,
  localSources: Source[],
  globalSourceMap: Map<string, number>
): string {
  return body.replace(CITATION_RE, (match, numStr: string) => {
    const localIndex = Number.parseInt(numStr, 10) - 1
    const source = localSources[localIndex]
    if (!source) {
      return match
    }
    const globalIndex = globalSourceMap.get(source.url)
    if (globalIndex === undefined) {
      return match
    }
    return `[${globalIndex + 1}]`
  })
}

// -- Main function --

export const generateDocument = inngest.createFunction(
  {
    id: 'generate-document',
    idempotency: 'event.data.documentId + "-" + event.data.locale',
  },
  { event: 'document/generation.requested' },
  async ({ event, step }) => {
    const { topic, locale, documentId } = event.data

    // ── Phase 1: Broad research to inform the outline ─────────────────────

    const globalResearch = await step.run('research-global', async () => {
      const queries = [
        `${topic} overview`,
        `${topic} history and origins`,
        `${topic} key facts and statistics`,
        `${topic} recent developments`,
        `${topic} scientific evidence and research`,
        `${topic} expert analysis and consensus`,
        `${topic} controversies and criticism`,
        `${topic} global impact and significance`,
      ]

      const queryResults = await Promise.all(
        queries.map(async (query) => {
          const response = await searchWeb(query, { numResults: 5 })
          return response.results.map((r) => ({
            url: r.url ?? '',
            title: r.title ?? 'Untitled source',
            snippet: (r.text ?? '').slice(0, 500),
          }))
        })
      )

      const deduped = new Map<string, Source>()
      for (const resultSet of queryResults) {
        for (const result of resultSet) {
          if (!result.url || deduped.has(result.url)) {
            continue
          }
          const parsed = SourceSchema.safeParse(result)
          if (parsed.success) {
            deduped.set(parsed.data.url, parsed.data)
          }
        }
      }

      return {
        queries,
        sources: Array.from(deduped.values()),
      }
    })

    // ── Phase 2: Orchestrator creates detailed outline ────────────────────

    const outline = await step.run('orchestrate-outline', () => {
      return generateStructured(
        OutlineSchema,
        ORCHESTRATOR_SYSTEM_PROMPT,
        [
          `Model: ${AI_MODEL}`,
          `Locale: ${locale}`,
          `Topic: ${topic}`,
          '',
          'Create a comprehensive, Wikipedia-style editorial plan for this topic.',
          '',
          'The document title must be concise like a Wikipedia article title (e.g. "Life", "Photosynthesis", "Climate change"), not a verbose phrase.',
          '',
          'The summary should be a 2-3 sentence neutral description of the topic suitable as a lead paragraph.',
          '',
          'Requirements for sections:',
          '- Plan 10 to 15 sections for thorough, encyclopedic coverage.',
          '- Section headings must be plain descriptive titles without numbering prefixes (no "1)", "2.", "a)", etc.).',
          '- Each section needs a purpose statement (1-2 sentences explaining scope and why it matters).',
          '- Each section needs 3-5 specific key points the writer must address.',
          '- Each section needs 2-3 specific web search queries for targeted research on that section.',
          '- Sections should progress logically: definition/overview first, then history, then detailed aspects, then impact/controversies, then outlook.',
          '- Ensure no thematic overlap between sections.',
          '- At least one section should cover criticisms, controversies, or limitations.',
          '- At least one section should cover recent developments or current status.',
          '',
          'Available research to inform your editorial plan:',
          JSON.stringify(globalResearch.sources, null, 2),
        ].join('\n'),
        'document_outline'
      )
    })

    // ── Phase 3: Per-section targeted research ────────────────────────────

    const sectionResearch: SectionResearch[] = []

    for (
      let batchStart = 0;
      batchStart < outline.sections.length;
      batchStart += SECTION_RESEARCH_BATCH_SIZE
    ) {
      const batchEnd = Math.min(
        batchStart + SECTION_RESEARCH_BATCH_SIZE,
        outline.sections.length
      )
      const batch = outline.sections.slice(batchStart, batchEnd)
      const batchNumber =
        Math.floor(batchStart / SECTION_RESEARCH_BATCH_SIZE) + 1

      const batchResults = await step.run(
        `research-sections-batch-${batchNumber}`,
        async () => {
          const results: SectionResearch[] = []

          await Promise.all(
            batch.map(async (section, localIdx) => {
              const sectionIndex = batchStart + localIdx
              const querySourceLists: Source[][] = []

              await Promise.all(
                section.searchQueries.slice(0, 3).map(async (query) => {
                  const response = await searchWeb(query, { numResults: 5 })
                  const sources = response.results
                    .map((r) => ({
                      url: r.url ?? '',
                      title: r.title ?? 'Untitled source',
                      snippet: (r.text ?? '').slice(0, 500),
                    }))
                    .filter(
                      (s): s is Source => SourceSchema.safeParse(s).success
                    )
                  querySourceLists.push(sources)
                })
              )

              results.push({
                sectionIndex,
                sources: deduplicateSources(querySourceLists),
              })
            })
          )

          return results
        }
      )

      sectionResearch.push(...batchResults)
    }

    // ── Phase 4: Per-section writing (each section is its own step) ───────

    const sectionDrafts: SectionDraft[] = []

    for (let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i]
      const research = sectionResearch.find((sr) => sr.sectionIndex === i)
      const sectionSources = research?.sources ?? []

      const draft = await step.run(`write-section-${i}`, () => {
        const numberedSources = sectionSources.map((source, idx) => ({
          index: idx + 1,
          ...source,
        }))

        return generateStructured(
          SectionDraftSchema,
          SECTION_WRITER_SYSTEM_PROMPT,
          [
            `Model: ${AI_MODEL}`,
            `Locale: ${locale}`,
            `Topic: ${topic}`,
            `Document title: ${outline.title}`,
            '',
            `Section heading: "${section.heading}"`,
            `Section purpose: ${section.purpose}`,
            `Key points to cover: ${section.keyPoints.join('; ')}`,
            '',
            'Full document outline (for context on where your section fits):',
            outline.sections
              .map(
                (s, idx) =>
                  `${idx === i ? '>>> ' : '    '}${idx + 1}. ${s.heading}${idx === i ? ' (YOU ARE WRITING THIS)' : ''}`
              )
              .join('\n'),
            '',
            `You are writing section ${i + 1} of ${outline.sections.length}.`,
            'Do not cover material from other sections. Focus exclusively on your assigned scope.',
            '',
            'Cite sources using [n] notation where n matches the source index listed below.',
            'You MUST cite sources densely. Aim for at least one citation every 1-2 sentences.',
            'Only cite a source if it actually supports the claim you are making.',
            '',
            `Available sources (${numberedSources.length} total):`,
            JSON.stringify(numberedSources, null, 2),
          ].join('\n'),
          `section_draft_${i}`
        )
      })

      sectionDrafts.push({
        sectionIndex: i,
        heading: section.heading,
        body: draft.body,
        sources: sectionSources,
      })
    }

    // ── Phase 5: Assemble final document ──────────────────────────────────

    const assembledDocument = await step.run('assemble', () => {
      // Build global source list ordered by first appearance across sections
      const globalSources: Source[] = []
      const globalSourceUrlSet = new Set<string>()

      const sortedDrafts = [...sectionDrafts].sort(
        (a, b) => a.sectionIndex - b.sectionIndex
      )

      for (const draft of sortedDrafts) {
        for (const match of draft.body.matchAll(CITATION_RE)) {
          const localIndex = Number.parseInt(match[1], 10) - 1
          const source = draft.sources[localIndex]
          if (source && !globalSourceUrlSet.has(source.url)) {
            globalSourceUrlSet.add(source.url)
            globalSources.push(source)
          }
        }
      }

      // Build URL -> global index map for citation remapping
      const globalSourceMap = new Map<string, number>(
        globalSources.map((s, i) => [s.url, i])
      )

      // Remap per-section local citations to global citation numbers
      const orderedSections = sortedDrafts.map((draft) => {
        const remappedBody = remapCitations(
          draft.body,
          draft.sources,
          globalSourceMap
        )
        return `## ${draft.heading}\n\n${remappedBody}`.trim()
      })

      // Build source list for the markdown footer
      const sourceListMarkdown = globalSources
        .map(
          (source, index) => `${index + 1}. [${source.title}](${source.url})`
        )
        .join('\n')

      // Assemble full document
      const markdown = [
        `# ${outline.title}`,
        outline.summary,
        ...orderedSections,
        '## Sources',
        sourceListMarkdown,
      ].join('\n\n')

      return {
        title: outline.title,
        content: markdown,
        sources: globalSources,
      }
    })

    // ── Phase 6: Save to database ─────────────────────────────────────────

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

    // ── Phase 7: Trigger downstream verification ──────────────────────────

    await step.sendEvent('fan-out-verification', {
      name: 'document/verification.requested',
      data: { documentId, locale },
    })

    return {
      documentId,
      title: assembledDocument.title,
      sourceCount: assembledDocument.sources.length,
      sectionCount: outline.sections.length,
    }
  }
)
