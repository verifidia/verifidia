import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { checkCachedTopics } from "@/lib/related-topics";
import { topicToSlug } from "@/lib/article-router";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  try {
    const [article] = await db
      .select({ relatedTopics: articles.relatedTopics })
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.locale, locale)))
      .limit(1);

    if (!article) {
      return NextResponse.json({ topics: [] });
    }

    const relatedTopics = article.relatedTopics ?? [];
    const cachedMap = await checkCachedTopics(relatedTopics, locale);

    const topics = relatedTopics.map(topic => ({
      name: topic,
      slug: cachedMap.get(topic) ?? topicToSlug(topic),
      cached: cachedMap.has(topic),
    }));

    return NextResponse.json({ topics });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch related topics" }, { status: 500 });
  }
}
