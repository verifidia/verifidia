import { getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/layout/search-bar";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { getRecentArticles, getRecentApprovedEdits } from "@/lib/recent";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getConfidenceBadgeVariant(score: number) {
  if (score >= 0.8) return "default" as const;
  if (score >= 0.5) return "secondary" as const;
  return "destructive" as const;
}

const feedbackTypeLabels: Record<string, string> = {
  thumbs_up: "Helpful",
  thumbs_down: "Not helpful",
  block_feedback: "Section edit",
  article_feedback: "Article edit",
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const [recentArticles, recentEdits] = await Promise.all([
    getRecentArticles(locale),
    getRecentApprovedEdits(),
  ]);

  return (
    <div className="space-y-14 py-8 sm:space-y-16 sm:py-12">
      <section className="mx-auto max-w-4xl space-y-6 text-center">
        <p className="text-primary text-sm font-semibold tracking-widest uppercase">{t("title")}</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          The Open Verified Encyclopedia
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Verified articles with full transparency. Search any topic.
        </p>
        <SearchBar locale={locale} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">{t("recentArticles")}</h2>
          {recentArticles.length > 0 ? (
            <div className="space-y-3">
              {recentArticles.map((article) => {
                const score = parseFloat(article.confidenceScore);
                const variant = getConfidenceBadgeVariant(score);
                const truncatedSummary =
                  article.summary.length > 120
                    ? article.summary.slice(0, 120) + "…"
                    : article.summary;

                return (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="bg-card block rounded-xl border p-5 transition-colors hover:bg-muted/35"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-medium">{article.title}</h3>
                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                          {truncatedSummary}
                        </p>
                      </div>
                      <Badge variant={variant} className="shrink-0">
                        {Math.round(score * 100)}% {t("confidence")}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-3 text-xs">
                      {getRelativeTime(article.updatedAt)}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("noArticlesYet")}</p>
          )}
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">{t("recentChanges")}</h2>
          {recentEdits.length > 0 ? (
            <div className="space-y-3">
              {recentEdits.map((edit) => {
                const truncatedContent =
                  edit.content && edit.content.length > 80
                    ? edit.content.slice(0, 80) + "…"
                    : edit.content;

                return (
                  <div key={edit.id} className="bg-card rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {feedbackTypeLabels[edit.feedbackType] ?? edit.feedbackType}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {getRelativeTime(edit.updatedAt)}
                      </span>
                    </div>
                    <Link
                      href={`/article/${edit.articleSlug}`}
                      locale={edit.articleLocale as "en"}
                      className="text-primary mt-2 block text-sm font-medium hover:underline"
                    >
                      {edit.articleTitle}
                    </Link>
                    {truncatedContent && (
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {truncatedContent}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("noChangesYet")}</p>
          )}
        </section>
      </div>
    </div>
  );
}
