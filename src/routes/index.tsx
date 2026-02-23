import { createFileRoute, Link } from '@tanstack/react-router'
import {
  IconClockOutline18,
  IconGlobeOutline18,
  IconNewspaperOutline18,
  IconShieldCheckOutline18,
} from 'nucleo-ui-outline-18'
import { getApiUrl } from '#/lib/get-api-url'
import {
  home_empty_hint,
  home_empty_title,
  home_recent,
  home_updated,
  untitled,
} from '#/paraglide/messages'

interface ArticleResult {
  id: string
  locale: string
  snippet: string
  title: string
  updatedAt: string | null
  verificationScore: number | null
}

export const Route = createFileRoute('/')({
  loader: async () => {
    const res = await fetch(getApiUrl('/api/search?q=&locale=en&limit=20'))
    if (!res.ok) {
      return { results: [] as ArticleResult[] }
    }
    const data = (await res.json()) as { results: ArticleResult[] }
    return { results: data.results }
  },
  component: HomePage,
})

function HomePage() {
  const { results } = Route.useLoaderData()

  if (results.length === 0) {
    return (
      <div className="mx-auto max-w-[900px] px-6 py-10 md:px-16 md:py-16 lg:px-24">
        <EmptyState />
      </div>
    )
  }

  const leadArticle = results[0]
  const sideArticles = results.slice(1, 5)
  const belowFoldArticles = results.slice(5)

  return (
    <div className="mx-auto max-w-[900px] px-6 py-10 md:px-16 md:py-16 lg:px-24">
      <section className="mt-10 flex flex-col gap-1">
        <article className="w-full">
          <LeadArticleCard article={leadArticle} />
        </article>

        <div className="flex w-full flex-col gap-1">
          {sideArticles.map((article) => (
            <article key={article.id}>
              <SideArticleCard article={article} />
            </article>
          ))}
        </div>
      </section>

      {belowFoldArticles.length > 0 ? (
        <section className="mt-12">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-semibold text-foreground text-lg">
              {home_updated()}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
            {belowFoldArticles.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function LeadArticleCard({ article }: { article: ArticleResult }) {
  const formattedDate = formatDate(article.updatedAt)
  const excerpt = stripMarkdown(article.snippet).slice(0, 150)

  return (
    <Link
      className="group -mx-3 block rounded-sm px-3 py-3 outline-none transition-colors duration-75 hover:bg-accent focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
      params={{ documentId: article.id }}
      search={{ locale: undefined }}
      to="/documents/$documentId"
    >
      <span className="mb-2 inline-block font-medium text-muted-foreground text-xs tracking-wide">
        {home_recent()}
      </span>

      <h2 className="mb-1 font-semibold text-foreground text-lg">
        {article.title || untitled()}
      </h2>

      {excerpt ? (
        <p className="mb-2 max-w-prose text-base text-muted-foreground leading-relaxed">
          {excerpt}
        </p>
      ) : null}

      <ArticleMeta article={article} formattedDate={formattedDate} />
    </Link>
  )
}

function SideArticleCard({ article }: { article: ArticleResult }) {
  const formattedDate = formatDate(article.updatedAt)

  return (
    <Link
      className="group -mx-3 block rounded-sm px-3 py-2 outline-none transition-colors duration-75 hover:bg-accent focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
      params={{ documentId: article.id }}
      search={{ locale: undefined }}
      to="/documents/$documentId"
    >
      <h3 className="mb-1 font-medium text-base text-foreground">
        {article.title || untitled()}
      </h3>

      <ArticleMeta article={article} formattedDate={formattedDate} />
    </Link>
  )
}

function ArticleCard({ article }: { article: ArticleResult }) {
  const formattedDate = formatDate(article.updatedAt)
  const excerpt = stripMarkdown(article.snippet).slice(0, 150)

  return (
    <article>
      <Link
        className="group -mx-3 block rounded-sm px-3 py-2 outline-none transition-colors duration-75 hover:bg-accent focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
        params={{ documentId: article.id }}
        search={{ locale: undefined }}
        to="/documents/$documentId"
      >
        <h3 className="mb-1 truncate font-medium text-base text-foreground">
          {article.title || untitled()}
        </h3>

        {excerpt ? (
          <p className="mb-2 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
            {excerpt}
          </p>
        ) : null}

        <ArticleMeta article={article} formattedDate={formattedDate} />
      </Link>
    </article>
  )
}

function ArticleMeta({
  article,
  formattedDate,
}: {
  article: ArticleResult
  formattedDate: string | null
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
      {article.verificationScore != null ? (
        <span className="inline-flex items-center gap-1.5">
          <IconShieldCheckOutline18
            aria-hidden="true"
            className="h-3.5 w-3.5"
          />
          {article.verificationScore}/100
        </span>
      ) : null}

      <span className="inline-flex items-center gap-1.5">
        <IconGlobeOutline18 aria-hidden="true" className="h-3.5 w-3.5" />
        {article.locale.toUpperCase()}
      </span>

      {formattedDate ? (
        <span className="inline-flex items-center gap-1.5">
          <IconClockOutline18 aria-hidden="true" className="h-3.5 w-3.5" />
          {formattedDate}
        </span>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-10 py-20 text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-sm bg-muted">
        <IconNewspaperOutline18
          aria-hidden="true"
          className="h-5 w-5 text-muted-foreground"
        />
      </div>
      <p className="mb-1 font-medium text-base text-foreground">
        {home_empty_title()}
      </p>
      <p className="mx-auto max-w-sm text-muted-foreground text-sm">
        {home_empty_hint()}
      </p>
    </div>
  )
}

function formatDate(iso: string | null): string | null {
  if (!iso) {
    return null
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_`~>[\]()!|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
