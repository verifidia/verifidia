import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export async function checkCachedTopics(topics: string[], locale: string): Promise<Map<string, string>> {
  if (topics.length === 0) return new Map();

  const cached = await db
    .select({ topic: articles.topic, slug: articles.slug })
    .from(articles)
    .where(and(
      inArray(articles.topic, topics),
      eq(articles.locale, locale),
      eq(articles.status, "completed")
    ));

  return new Map(cached.map(r => [r.topic, r.slug]));
}
