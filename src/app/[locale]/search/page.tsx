import { Suspense } from "react";
import { SearchInput } from "@/components/search/search-input";
import { SearchResults } from "@/components/search/search-results";
import { getArticleRoute } from "@/lib/article-router";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Search</h1>

      <Suspense
        fallback={<p className="text-muted-foreground py-12 text-center">Searching...</p>}
      >
        <SearchContent locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

type SearchContentProps = {
  locale: string;
  searchParams: Promise<{ q?: string }>;
};

async function SearchContent({ locale, searchParams }: SearchContentProps) {
  const { q } = await searchParams;
  
  let generateRoute = "/generate";
  try {
    generateRoute = q ? await getArticleRoute(q, locale) : "/generate";
  } catch (error) {
    console.error("Error getting article route:", error);
  }

  let results: Array<{
    slug: string;
    title: string;
    summary: string;
    locale: string;
    generatedAt: Date;
  }> = [];

  if (q) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/search?q=${encodeURIComponent(q)}&locale=${locale}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as { results: typeof results };
      results = data.results ?? [];
    } catch {
      results = [];
    }
  }

  return (
    <>
      <div className="mb-8">
        <SearchInput defaultValue={q ?? ""} />
      </div>

      {q ? (
        <div>
          <p className="text-muted-foreground mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{q}&quot;
          </p>
          <SearchResults
            results={results}
            query={q}
            locale={locale}
            generateRoute={generateRoute}
          />
        </div>
      ) : (
        <p className="text-muted-foreground py-12 text-center">
          Type a topic to search for articles
        </p>
      )}
    </>
  );
}
