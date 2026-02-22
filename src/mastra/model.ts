/**
 * Shared model configuration for all Mastra agents.
 *
 * When OPENAI_BASE_URL is set (e.g. cliproxyapi), the `url` field triggers
 * Mastra's `createOpenAICompatible().chatModel()` path which uses
 * /chat/completions instead of the Responses API (/responses).
 *
 * When OPENAI_BASE_URL is unset, `url` is undefined and Mastra falls through
 * to the default gateway which uses the Responses API against OpenAI directly.
 */
export const MODEL_ID = "openai/gpt-5.2" as const;
export const modelConfig = {
  id: MODEL_ID,
  url: process.env.OPENAI_BASE_URL,
} as const;
