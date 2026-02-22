import { NextRequest, NextResponse } from "next/server";
import { articleGenerationWorkflow } from "@/mastra/workflows/article-generation";
import { getArticle } from "@/lib/article-cache";
import {
  acquireGenerationLock,
  releaseGenerationLock,
  waitForArticle,
} from "@/lib/generation-lock";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { topic, locale } = body;

  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  if (!locale) {
    return NextResponse.json({ error: "locale is required" }, { status: 400 });
  }

  const cached = await getArticle(topic, locale);
  if (cached) {
    return NextResponse.json({
      cached: true,
      slug: cached.slug,
      title: cached.title,
      confidenceScore: cached.confidenceScore,
    });
  }

  const lockAcquired = await acquireGenerationLock(topic, locale);

  if (!lockAcquired) {
    const appeared = await waitForArticle(topic, locale);

    if (appeared) {
      const article = await getArticle(topic, locale);
      if (article) {
        return NextResponse.json({
          cached: true,
          slug: article.slug,
          title: article.title,
          confidenceScore: article.confidenceScore,
        });
      }
    }

    return NextResponse.json({ error: "Verification timed out" }, { status: 504 });
  }

  try {
    const run = await articleGenerationWorkflow.createRun();
    const result = await run.start({ inputData: { topic, locale } });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await releaseGenerationLock(topic, locale);
  }
}
