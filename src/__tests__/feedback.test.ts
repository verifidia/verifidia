import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockDb = {
  insert: mockInsert,
};

vi.mock("@/db", () => ({
  get db() {
    return mockDb;
  },
}));

describe("feedback schema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates thumbs_up feedback", async () => {
    const { feedbackInputSchema } = await import("@/lib/feedback");

    const parsed = feedbackInputSchema.safeParse({
      articleId: "550e8400-e29b-41d4-a716-446655440000",
      feedbackType: "thumbs_up",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid articleId", async () => {
    const { feedbackInputSchema } = await import("@/lib/feedback");

    const parsed = feedbackInputSchema.safeParse({
      articleId: "not-a-uuid",
      feedbackType: "thumbs_up",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid feedbackType", async () => {
    const { feedbackInputSchema } = await import("@/lib/feedback");

    const parsed = feedbackInputSchema.safeParse({
      articleId: "550e8400-e29b-41d4-a716-446655440000",
      feedbackType: "invalid_type",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts optional blockIndex", async () => {
    const { feedbackInputSchema } = await import("@/lib/feedback");

    const parsed = feedbackInputSchema.safeParse({
      articleId: "550e8400-e29b-41d4-a716-446655440000",
      feedbackType: "block_feedback",
      blockIndex: 2,
    });

    expect(parsed.success).toBe(true);
  });
});

describe("feedback API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("@/app/api/feedback/route");

    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({ articleId: "bad-id", feedbackType: "thumbs_up" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
  });

  it("returns 200 for valid feedback", async () => {
    mockReturning.mockResolvedValue([{ id: "8ee77101-f7a6-4833-86ec-a9f7f6b5f2f5" }]);

    const { POST } = await import("@/app/api/feedback/route");
    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        feedbackType: "thumbs_down",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request as Parameters<typeof POST>[0]);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      feedbackId: "8ee77101-f7a6-4833-86ec-a9f7f6b5f2f5",
    });
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});
