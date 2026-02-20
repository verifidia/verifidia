import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Article } from "@/types/article";

export async function getArticle(topic: string, locale: string): Promise<Article | null> {
  const results = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.topic, topic),
        eq(articles.locale, locale),
        eq(articles.status, "completed")
      )
    )
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const row = results[0]!;

  return {
    id: row.id,
    slug: row.slug,
    topic: row.topic,
    locale: row.locale,
    title: row.title,
    summary: row.summary ?? "",
    sections: (row.content as Article["sections"]) ?? [],
    citations: (row.citations as Article["citations"]) ?? [],
    relatedTopics: row.relatedTopics ?? [],
    modelUsed: row.modelUsed ?? "",
    systemPromptUsed: row.systemPromptUsed ?? "",
    sourcesConsulted: (row.sourcesConsulted as Article["sourcesConsulted"]) ?? [],
    confidenceScore: parseFloat(row.confidenceScore ?? "0"),
    generationTimeMs: row.generationTimeMs ?? 0,
    generatedAt: row.generatedAt,
    status: row.status,
  };
}

export async function isGenerating(topic: string, locale: string): Promise<boolean> {
  const results = await db
    .select({ id: articles.id })
    .from(articles)
    .where(
      and(
        eq(articles.topic, topic),
        eq(articles.locale, locale),
        eq(articles.status, "generating")
      )
    )
    .limit(1);

  return results.length > 0;
}
