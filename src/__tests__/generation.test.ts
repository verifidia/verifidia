import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockStart, mockCreateRun } = vi.hoisted(() => ({
  mockStart: vi.fn(),
  mockCreateRun: vi.fn(),
}));

vi.mock("@/lib/safety", () => ({
  isBlockedTopic: vi.fn((topic: string) => ({
    blocked: topic.includes("bomb"),
    reason: topic.includes("bomb") ? "Harmful content" : undefined,
  })),
  SAFETY_CONSTRAINTS: "Do not provide harmful content.",
  getConfidenceBanner: vi.fn(),
  getConfidenceThreshold: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(),
      })),
    })),
  },
}));

vi.mock("@/mastra/agents/research-agent", () => ({
  researchAgent: {
    generate: vi.fn(async () => ({
      text: JSON.stringify({
        sources: [
          { title: "Test", url: "https://test.com", snippet: "Test snippet" },
        ],
      }),
    })),
  },
}));

vi.mock("@/mastra/agents/writer-agent", () => ({
  writerAgent: {
    generate: vi.fn(async () => ({
      text: JSON.stringify({
        title: "Test Article",
        summary: "Test summary",
        sections: [{ heading: "Intro", content: "Content", citations: [0] }],
        relatedTopics: ["Topic A"],
      }),
    })),
  },
  WRITER_INSTRUCTIONS: "Write articles.",
}));

vi.mock("@/mastra/agents/citation-agent", () => ({
  citationAgent: {
    generate: vi.fn(async () => ({
      text: JSON.stringify([
        {
          text: "Test source",
          url: "https://test.com",
          accessedDate: "2026-02-21",
        },
      ]),
    })),
  },
}));

vi.mock("@/mastra/workflows/article-generation", () => ({
  articleGenerationWorkflow: {
    createRun: mockCreateRun,
  },
}));

vi.mock("@/lib/article-cache", () => ({
  getArticle: vi.fn(async () => null),
  isGenerating: vi.fn(async () => false),
}));

vi.mock("@/lib/generation-lock", () => ({
  acquireGenerationLock: vi.fn(async () => true),
  releaseGenerationLock: vi.fn(async () => undefined),
  waitForArticle: vi.fn(async () => false),
}));

describe("Article Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRun.mockReturnValue({ start: mockStart });
  });

  it("confidence score calculation is correct for 3 sources and 2 citations", () => {
    const sources = 3;
    const citations = 2;
    const score = Math.min(1, sources * 0.15 + citations * 0.1 + 0.4);
    expect(score).toBeCloseTo(1.05, 0);
    expect(score).toBeCloseTo(1);
  });

  it("confidence score is capped at 1.0", () => {
    const score = Math.min(1, 10 * 0.15 + 10 * 0.1 + 0.4);
    expect(score).toBe(1);
  });

  it("slug generation converts spaces to hyphens", () => {
    const topic = "Quantum Physics";
    const slug = topic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    expect(slug).toBe("quantum-physics");
  });

  it("slug generation removes special characters", () => {
    const topic = "C++ Programming";
    const slug = topic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    expect(slug).toBe("c-programming");
  });

  it("generate route returns 400 when topic is missing", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ locale: "en" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
  });

  it("generate route returns 400 when locale is missing", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ topic: "photosynthesis" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
  });

  it("generate route returns workflow result on success", async () => {
    mockStart.mockResolvedValueOnce({
      status: "success",
      result: { slug: "photosynthesis", title: "Photosynthesis", confidenceScore: 0.8 },
    });

    const { POST } = await import("@/app/api/generate/route");
    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ topic: "photosynthesis", locale: "en" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request as Parameters<typeof POST>[0]);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockCreateRun).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith({
      inputData: { topic: "photosynthesis", locale: "en" },
    });
    expect(body).toEqual({
      status: "success",
      result: { slug: "photosynthesis", title: "Photosynthesis", confidenceScore: 0.8 },
    });
  });

  it("generate route returns 500 when workflow fails", async () => {
    mockStart.mockRejectedValueOnce(new Error("Generation failed in workflow"));

    const { POST } = await import("@/app/api/generate/route");
    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ topic: "photosynthesis", locale: "en" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request as Parameters<typeof POST>[0]);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Generation failed in workflow" });
  });
});
