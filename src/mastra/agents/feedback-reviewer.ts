import { Agent } from "@mastra/core/agent";
import { modelConfig } from "../model";
import { z } from "zod";

export const feedbackReviewSchema = z.object({
  action: z.enum(["apply", "dismiss", "flag"]),
  reasoning: z.string(),
  suggestedChange: z.string().optional(),
});

export type FeedbackReviewResult = z.infer<typeof feedbackReviewSchema>;

export const feedbackReviewerAgent = new Agent({
  id: "feedback-reviewer-agent",
  name: "Feedback Reviewer Agent",
  instructions:
    "You are a feedback reviewer for a verified encyclopedia. Analyze user feedback and determine if article improvements are needed. Return valid JSON only with { action: 'apply' | 'dismiss' | 'flag', reasoning: string, suggestedChange?: string }.",
  model: modelConfig,
  tools: {},
});

export function parseFeedbackReviewResponse(text: string): FeedbackReviewResult {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const parsed = JSON.parse(withoutFence) as unknown;
  return feedbackReviewSchema.parse(parsed);
}

export async function reviewFeedback(input: {
  articleId: string;
  feedbackType: string;
  content: string | null;
  blockIndex: number | null;
}) {
  const prompt = [
    "Review this user feedback for an encyclopedia article and classify it.",
    `Article ID: ${input.articleId}`,
    `Feedback type: ${input.feedbackType}`,
    `Block index: ${input.blockIndex ?? "none"}`,
    `Feedback content: ${input.content ?? "(empty)"}`,
    "Return JSON only.",
  ].join("\n");

  const result = await feedbackReviewerAgent.generate(prompt);
  return parseFeedbackReviewResponse(result.text);
}
