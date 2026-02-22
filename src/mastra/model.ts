/**
 * Shared model configuration for all Mastra agents.
 *
 * Uses the default Mastra gateway which routes "openai/*" models
 * to the OpenAI Responses API via OPENAI_API_KEY.
 */
export const MODEL_ID = "openai/gpt-5.2" as const;
export const modelConfig = {
  id: MODEL_ID,
} as const;
