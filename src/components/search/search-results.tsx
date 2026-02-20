import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type SearchResult = {
  slug: string;
  title: string;
  summary: string;
  locale: string;
  generatedAt: Date | string;
};

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  locale: string;
  generateRoute: string;
}

export function SearchResults({ results, query, locale, generateRoute }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">
          No articles found for &quot;{query}&quot;
        </p>
        <Link
          href={generateRoute}
          locale={locale}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2"
        >
          Generate article about &quot;{query}&quot;
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.slug} className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <Link href={`/article/${result.slug}`} locale={locale} className="block">
              <h3 className="hover:text-primary mb-1 text-lg font-semibold">{result.title}</h3>
              <p className="text-muted-foreground line-clamp-2 text-sm">{result.summary}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{result.locale.toUpperCase()}</Badge>
                <span className="text-muted-foreground text-xs">
                  {new Date(result.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
