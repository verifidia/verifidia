import { Agent } from "@mastra/core/agent";
import { webSearchTool } from "../tools/web-search";
import { knowledgeLookupTool } from "../tools/knowledge-lookup";

export const researchAgent = new Agent({
  id: "research-agent",
  name: "Research Agent",
  instructions:
    "You are a research agent for an AI encyclopedia. Given a topic, use the web-search tool to find 3-5 authoritative sources. Summarize key facts with source URLs. Return a JSON object with: { sources: [{ title, url, snippet }], keyFacts: string[] }",
  model: "openai/gpt-4o-mini",
  tools: { "web-search": webSearchTool, "knowledge-lookup": knowledgeLookupTool },
});
