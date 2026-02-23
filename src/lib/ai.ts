import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import type { ZodType } from 'zod'

// -- Clients --

export const openai = new OpenAI()

// -- Constants --

export const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2'

const SNIPPET_CONTEXT_CHARS = 150

const WEB_SEARCH_INSTRUCTIONS =
  'Search the web for current, authoritative sources on the given topic. You MUST cite every source you use with a URL. Do not answer from training data alone — always perform a web search first.'

const RETRY_INSTRUCTIONS =
  'Your previous search returned no citations. You MUST search the web and cite at least one source URL. Do not respond without performing a web search.'

// -- Citation extraction --

interface SearchResult {
  text: string
  title: string
  url: string
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: citation extraction requires nested iteration over response structure
export function extractCitations(
  response: OpenAI.Responses.Response,
  limit: number
): SearchResult[] {
  const citationMap = new Map<string, SearchResult>()

  for (const item of response.output) {
    if (item.type === 'message') {
      for (const part of item.content) {
        if (part.type === 'output_text') {
          const partText = part.text ?? ''

          for (const annotation of part.annotations ?? []) {
            if (
              annotation.type === 'url_citation' &&
              !citationMap.has(annotation.url)
            ) {
              const start = Math.max(
                0,
                annotation.start_index - SNIPPET_CONTEXT_CHARS
              )
              const end = Math.min(
                partText.length,
                annotation.end_index + SNIPPET_CONTEXT_CHARS
              )
              const snippet = partText.slice(start, end).trim()

              citationMap.set(annotation.url, {
                url: annotation.url,
                title: annotation.title ?? '',
                text: snippet || partText.slice(0, 500),
              })
            }
          }
        }
      }
    }
  }

  return Array.from(citationMap.values()).slice(0, limit)
}

// -- Web search via Responses API --

export async function searchWeb(
  query: string,
  options?: { numResults?: number }
) {
  const limit = options?.numResults ?? 5

  const response = await openai.responses.create({
    model: AI_MODEL,
    instructions: WEB_SEARCH_INSTRUCTIONS,
    tools: [{ type: 'web_search_preview', search_context_size: 'medium' }],
    input: query,
  })

  const results = extractCitations(response, limit)
  if (results.length > 0) {
    return { results }
  }

  const retryResponse = await openai.responses.create({
    model: AI_MODEL,
    instructions: RETRY_INSTRUCTIONS,
    tools: [{ type: 'web_search_preview', search_context_size: 'medium' }],
    input: query,
  })

  return { results: extractCitations(retryResponse, limit) }
}

// -- Deep web search with high reasoning --

export async function searchWebDeep(
  query: string,
  options?: { numResults?: number }
) {
  const limit = options?.numResults ?? 5

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions: WEB_SEARCH_INSTRUCTIONS,
      tools: [{ type: 'web_search_preview', search_context_size: 'high' }],
      input: query,
      reasoning: { effort: 'high' },
    })

    const results = extractCitations(response, limit)
    if (results.length > 0) {
      return { results }
    }
  } catch {
    // reasoning param unsupported — fall through to retry without it
  }

  const fallbackResponse = await openai.responses.create({
    model: AI_MODEL,
    instructions: RETRY_INSTRUCTIONS,
    tools: [{ type: 'web_search_preview', search_context_size: 'high' }],
    input: query,
  })

  return { results: extractCitations(fallbackResponse, limit) }
}

// -- Structured output via chat.completions.parse() --

export async function generateStructured<T>(
  schema: ZodType<T>,
  systemPrompt: string,
  userPrompt: string,
  schemaName = 'response'
): Promise<T> {
  const completion = await openai.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: zodResponseFormat(schema, schemaName),
  })

  const message = completion.choices[0]?.message
  if (message?.refusal) {
    throw new Error(`AI refused: ${message.refusal}`)
  }
  if (!message?.parsed) {
    throw new Error('AI returned no parsed content')
  }
  return message.parsed
}

// -- Research with web search via Responses API --

export async function researchAndSynthesize(
  query: string,
  systemPrompt: string
): Promise<string> {
  const response = await openai.responses.create({
    model: AI_MODEL,
    instructions: systemPrompt,
    tools: [{ type: 'web_search_preview', search_context_size: 'medium' }],
    input: query,
  })

  if (!response.output_text) {
    throw new Error('AI returned no content')
  }
  return response.output_text
}

// -- Deep research with high reasoning --

export async function researchAndSynthesizeDeep(
  query: string,
  systemPrompt: string
): Promise<string> {
  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions: systemPrompt,
      tools: [{ type: 'web_search_preview', search_context_size: 'high' }],
      input: query,
      reasoning: { effort: 'high' },
    })

    if (response.output_text) {
      return response.output_text
    }
  } catch {
    // reasoning param unsupported — fall through
  }

  const fallback = await openai.responses.create({
    model: AI_MODEL,
    instructions: systemPrompt,
    tools: [{ type: 'web_search_preview', search_context_size: 'high' }],
    input: query,
  })

  if (!fallback.output_text) {
    throw new Error('AI returned no content')
  }
  return fallback.output_text
}
