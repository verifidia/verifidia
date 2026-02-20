import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feedback, feedbackTypeEnum } from "@/db/schema";

export const feedbackInputSchema = z.object({
  articleId: z.uuid(),
  feedbackType: z.enum(feedbackTypeEnum.enumValues),
  content: z.string().optional(),
  blockIndex: z.int().optional(),
  userId: z.string().optional(),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export async function submitFeedback(data: FeedbackInput) {
  const [inserted] = await db
    .insert(feedback)
    .values(data)
    .returning({ id: feedback.id });

  return { id: inserted.id };
}

export async function getFeedbackForArticle(articleId: string) {
  return db.select().from(feedback).where(eq(feedback.articleId, articleId));
}
