import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetPendingFeedback, mockUpdateFeedbackStatus, mockReviewFeedback } = vi.hoisted(() => ({
  mockGetPendingFeedback: vi.fn(),
  mockUpdateFeedbackStatus: vi.fn(),
  mockReviewFeedback: vi.fn(),
}));

vi.mock("@/lib/feedback-queue", () => ({
  getPendingFeedback: mockGetPendingFeedback,
  updateFeedbackStatus: mockUpdateFeedbackStatus,
}));

vi.mock("@/mastra/agents/feedback-reviewer", async () => {
  const actual = await vi.importActual<typeof import("@/mastra/agents/feedback-reviewer")>(
    "@/mastra/agents/feedback-reviewer"
  );

  return {
    ...actual,
    reviewFeedback: mockReviewFeedback,
  };
});

describe("feedback review workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses structured agent output", async () => {
    const { parseFeedbackReviewResponse } = await import("@/mastra/agents/feedback-reviewer");

    const parsed = parseFeedbackReviewResponse(`
      {"action":"apply","reasoning":"Clear factual correction","suggestedChange":"Fix the second paragraph"}
    `);

    expect(parsed).toEqual({
      action: "apply",
      reasoning: "Clear factual correction",
      suggestedChange: "Fix the second paragraph",
    });
  });

  it("processes pending feedback and updates statuses", async () => {
    mockGetPendingFeedback.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        articleId: "550e8400-e29b-41d4-a716-446655440101",
        feedbackType: "article_feedback",
        content: "This section has a factual error.",
        blockIndex: null,
        status: "pending",
        createdAt: new Date("2026-02-21T10:00:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        articleId: "550e8400-e29b-41d4-a716-446655440102",
        feedbackType: "thumbs_down",
        content: "I disagree with this but no details.",
        blockIndex: null,
        status: "pending",
        createdAt: new Date("2026-02-21T10:01:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        articleId: "550e8400-e29b-41d4-a716-446655440103",
        feedbackType: "block_feedback",
        content: "Potentially harmful framing in this block.",
        blockIndex: 2,
        status: "pending",
        createdAt: new Date("2026-02-21T10:02:00.000Z"),
      },
    ]);

    mockReviewFeedback
      .mockResolvedValueOnce({
        action: "apply",
        reasoning: "Specific, actionable correction.",
        suggestedChange: "Replace outdated statistic with 2025 data.",
      })
      .mockResolvedValueOnce({
        action: "dismiss",
        reasoning: "No actionable details.",
      })
      .mockResolvedValueOnce({
        action: "flag",
        reasoning: "Needs human moderation.",
      });

    const { runFeedbackReviewQueue } = await import("@/mastra/workflows/feedback-review");
    const summary = await runFeedbackReviewQueue();

    expect(summary).toEqual({ reviewed: 3, applied: 1, dismissed: 1, flagged: 1 });
    expect(mockReviewFeedback).toHaveBeenCalledTimes(3);
    expect(mockUpdateFeedbackStatus).toHaveBeenCalledTimes(3);
    expect(mockUpdateFeedbackStatus).toHaveBeenNthCalledWith(
      1,
      "550e8400-e29b-41d4-a716-446655440001",
      "applied",
      expect.objectContaining({ action: "apply" })
    );
    expect(mockUpdateFeedbackStatus).toHaveBeenNthCalledWith(
      2,
      "550e8400-e29b-41d4-a716-446655440002",
      "dismissed",
      expect.objectContaining({ action: "dismiss" })
    );
    expect(mockUpdateFeedbackStatus).toHaveBeenNthCalledWith(
      3,
      "550e8400-e29b-41d4-a716-446655440003",
      "reviewed",
      expect.objectContaining({ action: "flag" })
    );
  });
});

describe("feedback review API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns workflow summary on success", async () => {
    const mockStart = vi.fn().mockResolvedValue({
      status: "success",
      result: { reviewed: 4, applied: 2, dismissed: 1, flagged: 1 },
    });
    const mockCreateRun = vi.fn().mockResolvedValue({ start: mockStart });

    vi.resetModules();
    vi.doMock("@/mastra/workflows/feedback-review", () => ({
      feedbackReviewWorkflow: { createRun: mockCreateRun },
    }));

    const { POST } = await import("@/app/api/feedback/review/route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ reviewed: 4, applied: 2, dismissed: 1, flagged: 1 });
    expect(mockCreateRun).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith({ inputData: {} });
  });

  it("returns 500 when workflow throws", async () => {
    const mockStart = vi.fn().mockRejectedValue(new Error("workflow failed"));
    const mockCreateRun = vi.fn().mockResolvedValue({ start: mockStart });

    vi.resetModules();
    vi.doMock("@/mastra/workflows/feedback-review", () => ({
      feedbackReviewWorkflow: { createRun: mockCreateRun },
    }));

    const { POST } = await import("@/app/api/feedback/review/route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "workflow failed" });
  });
});
