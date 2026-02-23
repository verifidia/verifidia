import OpenAI from 'openai'
import { zodResponseFormat, zodFunction } from 'openai/helpers/zod'
import Exa from 'exa-js'
import { z } from 'zod'
import type { ZodType } from 'zod'

// -- Clients --

export const openai = new OpenAI()

export const exa = new Exa(process.env.EXA_API_KEY)

// -- Constants --

export const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2'

// -- Exa search wrapper --

export async function searchWeb(
  query: string,
  options?: { numResults?: number },
) {
  return exa.searchAndContents(query, {
    numResults: options?.numResults ?? 5,
    type: 'auto',
    livecrawl: 'always',
    text: { maxCharacters: 5000 },
  })
}

// -- Structured output via chat.completions.parse() --

export async function generateStructured<T>(
  schema: ZodType<T>,
  systemPrompt: string,
  userPrompt: string,
  schemaName: string = 'response',
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

// -- Research with Exa tool via chat.completions.runTools() --

export async function researchAndSynthesize(
  query: string,
  systemPrompt: string,
): Promise<string> {
  const runner = openai.chat.completions.runTools({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ],
    tools: [
      zodFunction({
        name: 'search_web',
        description: 'Search the web for current information on a topic',
        parameters: z.object({
          query: z.string().describe('Search query'),
        }),
        function: async ({ query: q }: { query: string }) => {
          const results = await searchWeb(q)
          return JSON.stringify(
            results.results.map((r) => ({
              title: r.title,
              url: r.url,
              text: r.text?.slice(0, 2000),
            })),
          )
        },
      }),
    ],
  })

  const result = await runner.finalContent()
  if (!result) {
    throw new Error('AI returned no content')
  }
  return result
}