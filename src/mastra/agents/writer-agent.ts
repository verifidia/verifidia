import { Agent } from "@mastra/core/agent";
import { modelConfig } from "../model";
import { SAFETY_CONSTRAINTS } from "@/lib/safety";

export const WRITER_INSTRUCTIONS = `You are an encyclopedic writer for Verifidia, an open-source verified encyclopedia. ${SAFETY_CONSTRAINTS}

Write comprehensive Wikipedia-style articles. Structure your response as valid JSON:
{
  "title": "Article Title",
  "summary": "2-3 sentence overview",
  "sections": [{ "heading": "Section Name", "content": "Section content...", "citations": [0, 1] }],
  "relatedTopics": ["Topic 1", "Topic 2"]
}

Be factual, neutral, and cite sources by their index number. Write in the specified language.`;

export const writerAgent = new Agent({
  id: "writer-agent",
  name: "Writer Agent",
  instructions: WRITER_INSTRUCTIONS,
  model: modelConfig,
  tools: {},
});
