import type { Metadata } from "next";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Link } from "@/i18n/routing";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { ArticleView } from "@/components/article/article-view";
import type { Article, ArticleCitation, ArticleSection } from "@/types/article";

type PageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

function mapSections(value: unknown): ArticleSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((section) => {
      if (typeof section !== "object" || !section) {
        return null;
      }

      const candidate = section as {
        heading?: unknown;
        content?: unknown;
        citations?: unknown;
      };

      const citations = Array.isArray(candidate.citations)
        ? candidate.citations.filter((citation): citation is number =>
            typeof citation === "number"
          )
        : [];

      return {
        heading: typeof candidate.heading === "string" ? candidate.heading : "",
        content: typeof candidate.content === "string" ? candidate.content : "",
        citations,
      };
    })
    .filter((section): section is ArticleSection => section !== null);
}

function mapCitations(value: unknown): ArticleCitation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((citation) => {
      if (typeof citation !== "object" || !citation) {
        return null;
      }

      const candidate = citation as {
        text?: unknown;
        url?: unknown;
        accessedDate?: unknown;
        accessed_date?: unknown;
      };

      const accessedDate =
        typeof candidate.accessedDate === "string"
          ? candidate.accessedDate
          : typeof candidate.accessed_date === "string"
            ? candidate.accessed_date
            : "";

      return {
        text: typeof candidate.text === "string" ? candidate.text : "",
        url: typeof candidate.url === "string" ? candidate.url : "",
        accessedDate,
      };
    })
    .filter((citation): citation is ArticleCitation => citation !== null);
}

function mapSources(value: unknown): { title: string; url: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((source) => {
      if (typeof source !== "object" || !source) {
        return null;
      }

      const candidate = source as {
        title?: unknown;
        url?: unknown;
      };

      return {
        title: typeof candidate.title === "string" ? candidate.title : "",
        url: typeof candidate.url === "string" ? candidate.url : "",
      };
    })
    .filter((source): source is { title: string; url: string } => source !== null);
}

function mapArticleRow(row: (typeof articles.$inferSelect) | undefined): Article | null {
  if (!row) {
    return null;
  }

  const confidenceScore =
    typeof row.confidenceScore === "number"
      ? row.confidenceScore
      : Number(row.confidenceScore);

  return {
    id: row.id,
    slug: row.slug,
    topic: row.topic,
    locale: row.locale,
    title: row.title,
    summary: row.summary,
    sections: mapSections(row.content),
    citations: mapCitations(row.citations),
    relatedTopics: row.relatedTopics,
    modelUsed: row.modelUsed,
    systemPromptUsed: row.systemPromptUsed,
    sourcesConsulted: mapSources(row.sourcesConsulted),
    confidenceScore: Number.isFinite(confidenceScore) ? confidenceScore : 0,
    generationTimeMs: row.generationTimeMs,
    generatedAt: row.generatedAt,
    status: row.status,
  };
}

const getArticleBySlug = cache(async (slug: string, locale: string) => {
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.locale, locale)))
    .limit(1);

  return mapArticleRow(rows[0]);
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connection();
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "article" });
  
  let article: Article | null = null;
  try {
    article = await getArticleBySlug(slug, locale);
  } catch (error) {
    console.error("Error fetching article for metadata:", error);
  }

  if (!article) {
    return {
      title: t("notFound"),
      description: t("notFoundMessage"),
    };
  }

  return {
    title: `${article.title} | Verifidia`,
    description: article.summary,
  };
}

export default async function ArticlePage({ params }: PageProps) {
  await connection();
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "article" });
  
  let article: Article | null = null;
  try {
    article = await getArticleBySlug(slug, locale);
  } catch (error) {
    // Handle database errors gracefully by showing not-found page
    console.error("Error fetching article:", error);
  }

  if (!article) {
    return (
      <main className="mx-auto flex  w-full max-w-4xl flex-col items-start justify-center px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t("notFound")}</h1>
        <p className="mt-3 text-muted-foreground">{t("notFoundMessage")}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-trust px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t("searchInstead")}
        </Link>
      </main>
    );
  }

  return <ArticleView article={article} />;
}
