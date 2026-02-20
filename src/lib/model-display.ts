const MODEL_NAMES: Record<string, string> = {
  "anthropic/claude-3-5-haiku-20241022": "Claude 3.5 Haiku (Anthropic)",
  "anthropic/claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet (Anthropic)",
  "anthropic/claude-sonnet-4-20250514": "Claude Sonnet 4 (Anthropic)",
  "openai/gpt-4o": "GPT-4o (OpenAI)",
  "openai/gpt-4o-mini": "GPT-4o Mini (OpenAI)",
  "openai/gpt-4.1": "GPT-4.1 (OpenAI)",
  "openai/gpt-4.1-mini": "GPT-4.1 Mini (OpenAI)",
  "openai/gpt-5.2": "GPT-5.2 (OpenAI)",
};

export function getModelDisplayName(modelId: string): string {
  return MODEL_NAMES[modelId] ?? modelId;
}
