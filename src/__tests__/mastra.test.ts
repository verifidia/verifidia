import { describe, it, expect, vi } from "vitest";

vi.mock("@mastra/pg", () => ({
  PgVector: vi.fn().mockImplementation(() => ({
    createIndex: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    upsert: vi.fn(),
  })),
}));

vi.mock("@mastra/core", () => ({
  Mastra: vi.fn().mockImplementation(() => ({
    getAgent: vi.fn(),
    getVector: vi.fn(),
  })),
}));

describe("Mastra Setup", () => {
  it("agent definitions have required properties", async () => {
    const { researchAgent } = await import("@/mastra/agents/research-agent");
    expect(researchAgent).toBeDefined();
  });

  it("writer agent is defined", async () => {
    const { writerAgent } = await import("@/mastra/agents/writer-agent");
    expect(writerAgent).toBeDefined();
  });

  it("citation agent is defined", async () => {
    const { citationAgent } = await import("@/mastra/agents/citation-agent");
    expect(citationAgent).toBeDefined();
  });

  it("article generation workflow is defined", async () => {
    const { articleGenerationWorkflow } = await import(
      "@/mastra/workflows/article-generation"
    );
    expect(articleGenerationWorkflow).toBeDefined();
  });

  it("web search tool has correct schema", async () => {
    const { webSearchTool } = await import("@/mastra/tools/web-search");
    expect(webSearchTool).toBeDefined();
    expect(webSearchTool.id).toBe("web-search");
  });
});
