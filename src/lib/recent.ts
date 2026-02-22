import { db } from "@/db";
import { articles, feedback } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getRecentArticles(locale: string, limit = 10) {
  try {
    return await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        summary: articles.summary,
        updatedAt: articles.updatedAt,
        confidenceScore: articles.confidenceScore,
      })
      .from(articles)
      .where(and(eq(articles.status, "completed"), eq(articles.locale, locale)))
      .orderBy(desc(articles.updatedAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function getRecentApprovedEdits(limit = 10) {
  try {
    return await db
      .select({
        id: feedback.id,
        feedbackType: feedback.feedbackType,
        content: feedback.content,
        updatedAt: feedback.updatedAt,
        articleTitle: articles.title,
        articleSlug: articles.slug,
        articleLocale: articles.locale,
      })
      .from(feedback)
      .innerJoin(articles, eq(feedback.articleId, articles.id))
      .where(eq(feedback.status, "applied"))
      .orderBy(desc(feedback.updatedAt))
      .limit(limit);
  } catch {
    return [];
  }
}
