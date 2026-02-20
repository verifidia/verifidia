import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { reviewFeedback } from "../agents/feedback-reviewer";
import { getPendingFeedback, updateFeedbackStatus } from "@/lib/feedback-queue";

const pendingFeedbackItemSchema = z.object({
  id: z.string().uuid(),
  articleId: z.string().uuid(),
  feedbackType: z.enum(["thumbs_up", "thumbs_down", "block_feedback", "article_feedback"]),
  content: z.string().nullable(),
  blockIndex: z.number().int().nullable(),
  status: z.enum(["pending", "reviewed", "applied", "dismissed"]),
  createdAt: z.date(),
});

const feedbackReviewSummarySchema = z.object({
  reviewed: z.number().int().nonnegative(),
  applied: z.number().int().nonnegative(),
  dismissed: z.number().int().nonnegative(),
  flagged: z.number().int().nonnegative(),
});

export type FeedbackReviewSummary = z.infer<typeof feedbackReviewSummarySchema>;

export async function runFeedbackReviewQueue(): Promise<FeedbackReviewSummary> {
  const pending = await getPendingFeedback();

  let applied = 0;
  let dismissed = 0;
  let flagged = 0;

  for (const entry of pending) {
    const review = await reviewFeedback({
      articleId: entry.articleId,
      feedbackType: entry.feedbackType,
      content: entry.content,
      blockIndex: entry.blockIndex,
    });

    if (review.action === "apply") {
      applied += 1;
      await updateFeedbackStatus(entry.id, "applied", review);
      continue;
    }

    if (review.action === "dismiss") {
      dismissed += 1;
      await updateFeedbackStatus(entry.id, "dismissed", review);
      continue;
    }

    flagged += 1;
    await updateFeedbackStatus(entry.id, "reviewed", review);
  }

  return {
    reviewed: pending.length,
    applied,
    dismissed,
    flagged,
  };
}

const fetchPendingFeedbackStep = createStep({
  id: "fetch-pending-feedback",
  inputSchema: z.object({}),
  outputSchema: z.object({ pending: z.array(pendingFeedbackItemSchema) }),
  execute: async () => {
    const pending = await getPendingFeedback();
    return { pending };
  },
});

const reviewFeedbackStep = createStep({
  id: "review-feedback",
  inputSchema: z.object({ pending: z.array(pendingFeedbackItemSchema) }),
  outputSchema: feedbackReviewSummarySchema,
  execute: async ({ inputData }) => {
    let applied = 0;
    let dismissed = 0;
    let flagged = 0;

    for (const entry of inputData.pending) {
      const review = await reviewFeedback({
        articleId: entry.articleId,
        feedbackType: entry.feedbackType,
        content: entry.content,
        blockIndex: entry.blockIndex,
      });

      if (review.action === "apply") {
        applied += 1;
        await updateFeedbackStatus(entry.id, "applied", review);
        continue;
      }

      if (review.action === "dismiss") {
        dismissed += 1;
        await updateFeedbackStatus(entry.id, "dismissed", review);
        continue;
      }

      flagged += 1;
      await updateFeedbackStatus(entry.id, "reviewed", review);
    }

    return {
      reviewed: inputData.pending.length,
      applied,
      dismissed,
      flagged,
    };
  },
});

export const feedbackReviewWorkflow = createWorkflow({
  id: "feedback-review",
  inputSchema: z.object({}),
  outputSchema: feedbackReviewSummarySchema,
})
  .then(fetchPendingFeedbackStep)
  .then(reviewFeedbackStep)
  .commit();
