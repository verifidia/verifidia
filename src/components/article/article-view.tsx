"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { Citation } from "@/components/article/citation";
import { ConfidenceBanner } from "@/components/article/confidence-banner";
import { TableOfContents } from "@/components/article/table-of-contents";
import type { Article } from "@/types/article";

type ArticleViewProps = {
  article: Article;
};

function formatGeneratedDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function ArticleView({ article }: ArticleViewProps) {
  const t = useTranslations("article");

  const generatedDate = useMemo(
    () => formatGeneratedDate(new Date(article.generatedAt), article.locale),
    [article.generatedAt, article.locale]
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto w-full max-w-6xl">
        <header className="max-w-4xl">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance md:text-5xl">
            {article.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("generatedAt", { date: generatedDate })}
          </p>

          <div className="mt-5">
            <ConfidenceBanner score={article.confidenceScore} />
          </div>

          <div className="mt-6 rounded-xl border border-trust/20 bg-trust-light px-5 py-4 shadow-sm">
            <p className="text-base leading-relaxed text-foreground/95">{article.summary}</p>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-article lg:gap-12">
          <TableOfContents sections={article.sections} title={t("tableOfContents")} />

          <div className="space-y-10">
            {article.sections.map((section, sectionIndex) => {
              const paragraphs = section.content
                .split(/\n{2,}/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean);

              return (
                <section
                  id={`section-${sectionIndex}`}
                  key={`${section.heading}-${sectionIndex}`}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>

                  <div className="mt-4 space-y-4 text-base leading-8 text-foreground/90">
                    {paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${section.heading}-${paragraphIndex}`}>
                        {paragraph}
                        {paragraphIndex === 0 &&
                          section.citations.map((citationIndex) => {
                            const citation = article.citations[citationIndex];
                            if (!citation) {
                              return null;
                            }

                            return (
                              <Citation
                                key={`${section.heading}-${citationIndex}`}
                                index={citationIndex + 1}
                                citation={citation}
                              />
                            );
                          })}
                      </p>
                    ))}
                  </div>
                </section>
              );
            })}

            <Separator />

            <section id="references" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold tracking-tight">{t("references")}</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm leading-6 text-foreground/90">
                {article.citations.map((citation, index) => (
                  <li key={`${citation.url}-${index}`} id={`ref-${index + 1}`}>
                    <span>{citation.text}</span>{" "}
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-trust underline decoration-dotted underline-offset-2"
                    >
                      {citation.url}
                    </a>
                    {citation.accessedDate ? (
                      <span className="text-muted-foreground"> (accessed {citation.accessedDate})</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold tracking-tight">{t("relatedTopics")}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {article.relatedTopics.map((topic) => (
                  <Badge key={topic} asChild variant="outline" className="rounded-full px-3 py-1">
                    <Link
                      href={`/?q=${encodeURIComponent(topic)}`}
                      className="text-trust"
                    >
                      {topic}
                    </Link>
                  </Badge>
                ))}
              </div>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
