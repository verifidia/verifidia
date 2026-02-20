import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { feedback, feedbackStatusEnum, feedbackTypeEnum } from "@/db/schema";

const pendingFeedbackSchema = {
  id: feedback.id,
  articleId: feedback.articleId,
  feedbackType: feedback.feedbackType,
  content: feedback.content,
  blockIndex: feedback.blockIndex,
  status: feedback.status,
  createdAt: feedback.createdAt,
} as const;

export type PendingFeedback = {
  id: string;
  articleId: string;
  feedbackType: (typeof feedbackTypeEnum.enumValues)[number];
  content: string | null;
  blockIndex: number | null;
  status: (typeof feedbackStatusEnum.enumValues)[number];
  createdAt: Date;
};

export async function getPendingFeedback() {
  return db
    .select(pendingFeedbackSchema)
    .from(feedback)
    .where(eq(feedback.status, "pending"))
    .orderBy(asc(feedback.createdAt))
    .limit(50);
}

export async function updateFeedbackStatus(
  id: string,
  status: (typeof feedbackStatusEnum.enumValues)[number],
  reviewResult?: unknown
) {
  await db
    .update(feedback)
    .set({
      status,
      reviewResult: reviewResult ? JSON.stringify(reviewResult) : null,
      updatedAt: new Date(),
    })
    .where(eq(feedback.id, id));
}
