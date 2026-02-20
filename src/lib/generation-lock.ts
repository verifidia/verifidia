import { db } from "@/db";
import { sql } from "drizzle-orm";

function getLockKey(topic: string, locale: string): string {
  return `${topic}:${locale}`;
}

export async function acquireGenerationLock(topic: string, locale: string): Promise<boolean> {
  const key = getLockKey(topic, locale);
  const result = await db.execute(sql`SELECT pg_try_advisory_lock(hashtext(${key})) as acquired`);
  const rows = result as unknown as Array<{ acquired: boolean }>;

  return rows[0]?.acquired ?? false;
}

export async function releaseGenerationLock(topic: string, locale: string): Promise<void> {
  const key = getLockKey(topic, locale);
  await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${key}))`);
}

export async function waitForArticle(topic: string, locale: string, timeoutMs = 120000): Promise<boolean> {
  const { getArticle } = await import("./article-cache");
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const article = await getArticle(topic, locale);

    if (article) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return false;
}
