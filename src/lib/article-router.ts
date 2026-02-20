import { getArticle } from "@/lib/article-cache";

export function topicToSlug(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function getArticleRoute(topic: string, locale: string): Promise<string> {
  const article = await getArticle(topic, locale);

  if (article) {
    return `/article/${article.slug}`;
  }

  return `/generate/${topicToSlug(topic)}`;
}
