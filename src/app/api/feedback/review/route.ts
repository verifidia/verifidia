import { NextResponse } from "next/server";
import { z } from "zod";
import { feedbackReviewWorkflow } from "@/mastra/workflows/feedback-review";

const reviewSummarySchema = z.object({
  reviewed: z.number().int().nonnegative(),
  applied: z.number().int().nonnegative(),
  dismissed: z.number().int().nonnegative(),
  flagged: z.number().int().nonnegative(),
});

export async function POST() {
  try {
    const run = await feedbackReviewWorkflow.createRun();
    const workflowResult = await run.start({ inputData: {} });

    const payload =
      typeof workflowResult === "object" &&
      workflowResult !== null &&
      "result" in workflowResult
        ? (workflowResult as { result: unknown }).result
        : workflowResult;

    const parsed = reviewSummarySchema.parse(payload);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Feedback review failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
