import { db } from "@/db";
import { articles } from "@/db/schema";
import { ilike, or, eq, and } from "drizzle-orm";

export async function searchArticles(query: string, locale: string) {
  if (!query.trim()) return [];

  return db
    .select({
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      locale: articles.locale,
      generatedAt: articles.generatedAt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.locale, locale),
        eq(articles.status, "completed"),
        or(
          ilike(articles.title, `%${query}%`),
          ilike(articles.topic, `%${query}%`)
        )
      )
    )
    .limit(20)
    .orderBy(articles.title);
}

export async function getAutocompleteSuggestions(
  query: string,
  locale: string
) {
  if (!query.trim()) return [];

  return db
    .select({
      topic: articles.topic,
      title: articles.title,
      slug: articles.slug,
    })
    .from(articles)
    .where(
      and(
        eq(articles.locale, locale),
        eq(articles.status, "completed"),
        or(
          ilike(articles.title, `%${query}%`),
          ilike(articles.topic, `%${query}%`)
        )
      )
    )
    .limit(5);
}
