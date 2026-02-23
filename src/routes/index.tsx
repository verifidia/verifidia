import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import * as m from '#/paraglide/messages'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import {
  IconMagnifierOutline18,
  IconShieldCheckOutline18,
  IconClockOutline18,
  IconGlobeOutline18,
  IconNewspaperOutline18,
} from 'nucleo-ui-outline-18'
import { getApiUrl } from '#/lib/get-api-url'

type ArticleResult = {
  id: string
  title: string
  snippet: string
  locale: string
  verificationScore: number | null
  updatedAt: string | null
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
      <div className="max-w-[900px] mx-auto px-6 md:px-16 lg:px-24 py-10 md:py-16">
        <HeroSection />
        <EmptyState />
      </div>
    )
  }

  const leadArticle = results[0]!
  const sideArticles = results.slice(1, 5)
  const belowFoldArticles = results.slice(5)

  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-16 lg:px-24 py-10 md:py-16">
      <HeroSection />

      <section className="flex flex-col gap-1 mt-10">
        <article className="w-full">
          <LeadArticleCard article={leadArticle} />
        </article>

        <div className="w-full flex flex-col gap-1">
          {sideArticles.map((article) => (
            <article key={article.id}>
              <SideArticleCard article={article} />
            </article>
          ))}
        </div>
      </section>

      {belowFoldArticles.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {m.home_updated()}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {belowFoldArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function HeroSection() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      navigate({ to: '/search', search: { q: query.trim() } })
    }
  }

  return (
    <section className="mb-10">
      <div className="pb-6 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
          {m.site_title()}
        </h1>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed">
          {m.site_tagline()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            <IconMagnifierOutline18 className="w-4 h-4" aria-hidden="true" />
          </div>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={m.search_placeholder()}
            className="pl-10 rounded-sm outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring border-border"
          />
        </div>
        <Button type="submit" variant="default" className="rounded-sm">
          {m.search_button()}
        </Button>
      </form>
    </section>
  )
}

function LeadArticleCard({ article }: { article: ArticleResult }) {
  const formattedDate = formatDate(article.updatedAt)
  const excerpt = stripMarkdown(article.snippet).slice(0, 150)

  return (
    <Link
      to="/documents/$documentId"
      params={{ documentId: article.id }}
      search={{ locale: undefined }}
      className="group block py-3 px-3 -mx-3 rounded-sm transition-colors duration-75 hover:bg-accent outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
    >
      <span className="inline-block text-xs font-medium tracking-wide text-muted-foreground mb-2">
        {m.home_recent()}
      </span>

      <h2 className="text-lg font-semibold text-foreground mb-1">
        {article.title || m.untitled()}
      </h2>

      {excerpt ? (
        <p className="text-base text-muted-foreground leading-relaxed mb-2 max-w-prose">
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
      to="/documents/$documentId"
      params={{ documentId: article.id }}
      search={{ locale: undefined }}
      className="group block py-2 px-3 -mx-3 rounded-sm transition-colors duration-75 hover:bg-accent outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
    >
      <h3 className="text-base font-medium text-foreground mb-1">
        {article.title || m.untitled()}
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
        to="/documents/$documentId"
        params={{ documentId: article.id }}
        search={{ locale: undefined }}
        className="group block py-2 px-3 -mx-3 rounded-sm transition-colors duration-75 hover:bg-accent outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
      >
        <h3 className="text-base font-medium text-foreground mb-1 truncate">
          {article.title || m.untitled()}
        </h3>

        {excerpt ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2">
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
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {article.verificationScore != null ? (
        <span className="inline-flex items-center gap-1.5">
          <IconShieldCheckOutline18 className="w-3.5 h-3.5" aria-hidden="true" />
          {article.verificationScore}/100
        </span>
      ) : null}

      <span className="inline-flex items-center gap-1.5">
        <IconGlobeOutline18 className="w-3.5 h-3.5" aria-hidden="true" />
        {article.locale.toUpperCase()}
      </span>

      {formattedDate ? (
        <span className="inline-flex items-center gap-1.5">
          <IconClockOutline18 className="w-3.5 h-3.5" aria-hidden="true" />
          {formattedDate}
        </span>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20 mt-10">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-muted mb-4">
        <IconNewspaperOutline18 className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">
        {m.home_empty_title()}
      </p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {m.home_empty_hint()}
      </p>
    </div>
  )
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

function stripMarkdown(text: string): string {
  return text.replace(/[#*_`~>\[\]()!|]/g, '').replace(/\s+/g, ' ').trim()
}
