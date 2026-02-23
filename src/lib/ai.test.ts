import { describe, it, expect, vi, beforeEach } from 'vitest'
import type OpenAI from 'openai'
import { z } from 'zod'

const mockResponsesCreate = vi.fn()
const mockChatCompletionsParse = vi.fn()

vi.mock('openai', () => ({
  default: vi.fn(() => ({
    responses: { create: mockResponsesCreate },
    chat: { completions: { parse: mockChatCompletionsParse } },
  })),
}))

vi.mock('openai/helpers/zod', () => ({
  zodResponseFormat: vi.fn((_schema: unknown, name: string) => ({ type: 'json_schema', json_schema: { name } })),
}))

function fakeResponse(options: {
  text: string
  citations?: Array<{ url: string; title: string; start_index: number; end_index: number }>
}): OpenAI.Responses.Response {
  return {
    output_text: options.text,
    output: [{
      type: 'message' as const,
      content: [{
        type: 'output_text' as const,
        text: options.text,
        annotations: (options.citations ?? []).map(c => ({
          type: 'url_citation' as const,
          ...c,
        })),
      }],
    }],
  } as unknown as OpenAI.Responses.Response
}

function fakeEmptyResponse(): OpenAI.Responses.Response {
  return {
    output_text: 'Some text without citations.',
    output: [{
      type: 'message' as const,
      content: [{
        type: 'output_text' as const,
        text: 'Some text without citations.',
        annotations: [],
      }],
    }],
  } as unknown as OpenAI.Responses.Response
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('extractCitations', () => {
  let extractCitations: typeof import('#/lib/ai').extractCitations

  beforeEach(async () => {
    const mod = await import('#/lib/ai')
    extractCitations = mod.extractCitations
  })

  it('extracts per-citation contextual snippets from annotation indices', () => {
    const longText = 'A'.repeat(200) + 'The capital of France is Paris.' + 'B'.repeat(200)
    const response = fakeResponse({
      text: longText,
      citations: [{
        url: 'https://example.com/paris',
        title: 'Paris Facts',
        start_index: 200,
        end_index: 230,
      }],
    })

    const results = extractCitations(response, 5)

    expect(results).toHaveLength(1)
    expect(results[0].url).toBe('https://example.com/paris')
    expect(results[0].title).toBe('Paris Facts')
    expect(results[0].text).toContain('The capital of France is Paris.')
    expect(results[0].text.length).toBeLessThan(longText.length)
  })

  it('deduplicates citations by URL', () => {
    const text = 'Source A mentions this. Source A also says that.'
    const response = fakeResponse({
      text,
      citations: [
        { url: 'https://a.com', title: 'A', start_index: 0, end_index: 10 },
        { url: 'https://a.com', title: 'A duplicate', start_index: 20, end_index: 30 },
        { url: 'https://b.com', title: 'B', start_index: 35, end_index: 45 },
      ],
    })

    const results = extractCitations(response, 10)

    expect(results).toHaveLength(2)
    expect(results[0].url).toBe('https://a.com')
    expect(results[0].title).toBe('A')
    expect(results[1].url).toBe('https://b.com')
  })

  it('respects the limit parameter', () => {
    const text = 'Many sources available here for research purposes.'
    const response = fakeResponse({
      text,
      citations: [
        { url: 'https://a.com', title: 'A', start_index: 0, end_index: 5 },
        { url: 'https://b.com', title: 'B', start_index: 10, end_index: 15 },
        { url: 'https://c.com', title: 'C', start_index: 20, end_index: 25 },
      ],
    })

    const results = extractCitations(response, 2)

    expect(results).toHaveLength(2)
  })

  it('returns empty array when response has no message output', () => {
    const response = {
      output_text: 'text',
      output: [{ type: 'web_search_call' }],
    } as unknown as OpenAI.Responses.Response

    const results = extractCitations(response, 5)

    expect(results).toEqual([])
  })

  it('falls back to first 500 chars when annotation indices produce empty snippet', () => {
    const text = 'A'.repeat(600)
    const response = fakeResponse({
      text,
      citations: [{
        url: 'https://example.com',
        title: 'Test',
        start_index: 0,
        end_index: 0,
      }],
    })

    const results = extractCitations(response, 5)

    expect(results).toHaveLength(1)
    expect(results[0].text.length).toBeLessThanOrEqual(500)
  })
})

describe('searchWeb', () => {
  let searchWeb: typeof import('#/lib/ai').searchWeb

  beforeEach(async () => {
    const mod = await import('#/lib/ai')
    searchWeb = mod.searchWeb
  })

  it('returns results with correct shape on first try', async () => {
    const text = 'React 19 was released with new features including server components.'
    mockResponsesCreate.mockResolvedValueOnce(fakeResponse({
      text,
      citations: [
        { url: 'https://react.dev/blog', title: 'React Blog', start_index: 0, end_index: 20 },
      ],
    }))

    const result = await searchWeb('React 19')

    expect(result.results).toHaveLength(1)
    expect(result.results[0]).toHaveProperty('url')
    expect(result.results[0]).toHaveProperty('title')
    expect(result.results[0]).toHaveProperty('text')
    expect(mockResponsesCreate).toHaveBeenCalledTimes(1)
  })

  it('passes instructions to the API call', async () => {
    mockResponsesCreate.mockResolvedValueOnce(fakeResponse({
      text: 'result',
      citations: [{ url: 'https://a.com', title: 'A', start_index: 0, end_index: 5 }],
    }))

    await searchWeb('test query')

    expect(mockResponsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining('MUST cite every source'),
      }),
    )
  })

  it('retries with stricter instructions when first call returns 0 citations', async () => {
    mockResponsesCreate
      .mockResolvedValueOnce(fakeEmptyResponse())
      .mockResolvedValueOnce(fakeResponse({
        text: 'Retry found results about the topic.',
        citations: [
          { url: 'https://retry.com', title: 'Retry Result', start_index: 0, end_index: 15 },
        ],
      }))

    const result = await searchWeb('obscure query')

    expect(mockResponsesCreate).toHaveBeenCalledTimes(2)
    expect(mockResponsesCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining('previous search returned no citations'),
      }),
    )
    expect(result.results).toHaveLength(1)
    expect(result.results[0].url).toBe('https://retry.com')
  })

  it('returns empty results when both attempts yield 0 citations', async () => {
    mockResponsesCreate
      .mockResolvedValueOnce(fakeEmptyResponse())
      .mockResolvedValueOnce(fakeEmptyResponse())

    const result = await searchWeb('impossible query')

    expect(mockResponsesCreate).toHaveBeenCalledTimes(2)
    expect(result.results).toEqual([])
  })
})

describe('searchWebDeep', () => {
  let searchWebDeep: typeof import('#/lib/ai').searchWebDeep

  beforeEach(async () => {
    const mod = await import('#/lib/ai')
    searchWebDeep = mod.searchWebDeep
  })

  it('passes reasoning param on first attempt', async () => {
    mockResponsesCreate.mockResolvedValueOnce(fakeResponse({
      text: 'Deep result',
      citations: [{ url: 'https://deep.com', title: 'Deep', start_index: 0, end_index: 5 }],
    }))

    await searchWebDeep('complex query')

    expect(mockResponsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reasoning: { effort: 'high' },
      }),
    )
  })

  it('falls back without reasoning param when first call throws', async () => {
    mockResponsesCreate
      .mockRejectedValueOnce(new Error('reasoning not supported'))
      .mockResolvedValueOnce(fakeResponse({
        text: 'Fallback result from non-reasoning call.',
        citations: [{ url: 'https://fallback.com', title: 'Fallback', start_index: 0, end_index: 10 }],
      }))

    const result = await searchWebDeep('complex query')

    expect(mockResponsesCreate).toHaveBeenCalledTimes(2)
    expect(result.results).toHaveLength(1)
    expect(result.results[0].url).toBe('https://fallback.com')
  })
})

describe('generateStructured', () => {
  let generateStructured: typeof import('#/lib/ai').generateStructured

  beforeEach(async () => {
    const mod = await import('#/lib/ai')
    generateStructured = mod.generateStructured
  })

  it('returns parsed content on success', async () => {
    const parsed = { name: 'test', value: 42 }
    mockChatCompletionsParse.mockResolvedValueOnce({
      choices: [{ message: { parsed, refusal: null } }],
    })

    const schema = z.object({ name: z.string(), value: z.number() })
    const result = await generateStructured(schema, 'system', 'user', 'test_schema')

    expect(result).toEqual(parsed)
  })

  it('throws on refusal', async () => {
    mockChatCompletionsParse.mockResolvedValueOnce({
      choices: [{ message: { parsed: null, refusal: 'I cannot do that' } }],
    })

    const schema = z.object({ name: z.string() })

    await expect(
      generateStructured(schema, 'system', 'user'),
    ).rejects.toThrow('AI refused: I cannot do that')
  })

  it('throws when no parsed content returned', async () => {
    mockChatCompletionsParse.mockResolvedValueOnce({
      choices: [{ message: { parsed: null, refusal: null } }],
    })

    const schema = z.object({ name: z.string() })

    await expect(
      generateStructured(schema, 'system', 'user'),
    ).rejects.toThrow('AI returned no parsed content')
  })
})

describe('researchAndSynthesize', () => {
  let researchAndSynthesize: typeof import('#/lib/ai').researchAndSynthesize

  beforeEach(async () => {
    const mod = await import('#/lib/ai')
    researchAndSynthesize = mod.researchAndSynthesize
  })

  it('returns output_text on success', async () => {
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: 'Synthesized research about quantum computing.',
      output: [],
    })

    const result = await researchAndSynthesize('quantum computing', 'You are a researcher.')

    expect(result).toBe('Synthesized research about quantum computing.')
  })

  it('throws when output_text is empty', async () => {
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: '',
      output: [],
    })

    await expect(
      researchAndSynthesize('query', 'system prompt'),
    ).rejects.toThrow('AI returned no content')
  })
})

describe('researchAndSynthesizeDeep', () => {
  let researchAndSynthesizeDeep: typeof import('#/lib/ai').researchAndSynthesizeDeep

  beforeEach(async () => {
    const mod = await import('#/lib/ai')
    researchAndSynthesizeDeep = mod.researchAndSynthesizeDeep
  })

  it('returns output_text with reasoning on success', async () => {
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: 'Deep research result.',
      output: [],
    })

    const result = await researchAndSynthesizeDeep('deep query', 'system')

    expect(result).toBe('Deep research result.')
    expect(mockResponsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reasoning: { effort: 'high' },
      }),
    )
  })

  it('falls back without reasoning when first call throws', async () => {
    mockResponsesCreate
      .mockRejectedValueOnce(new Error('unsupported'))
      .mockResolvedValueOnce({
        output_text: 'Fallback deep result.',
        output: [],
      })

    const result = await researchAndSynthesizeDeep('deep query', 'system')

    expect(result).toBe('Fallback deep result.')
    expect(mockResponsesCreate).toHaveBeenCalledTimes(2)
  })

  it('throws when both attempts return no content', async () => {
    mockResponsesCreate
      .mockResolvedValueOnce({ output_text: '', output: [] })
      .mockResolvedValueOnce({ output_text: '', output: [] })

    await expect(
      researchAndSynthesizeDeep('query', 'system'),
    ).rejects.toThrow('AI returned no content')
  })
})
