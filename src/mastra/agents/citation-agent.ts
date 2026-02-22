import { Agent } from "@mastra/core/agent";
import { modelConfig } from "../model";

export const citationAgent = new Agent({
  id: "citation-agent",
  name: "Citation Agent",
  instructions:
    'You are a citation formatter. Given research sources and article content, extract and format citations as JSON array: [{ "text": "Source description", "url": "https://...", "accessedDate": "2026-02-21" }]. Return only the JSON array.',
  model: modelConfig,
  tools: {},
});
