import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import * as m from '#/paraglide/messages'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import {
  IconMagnifierOutline24,
  IconShieldCheckOutline24,
  IconClockOutline24,
  IconGlobeOutline24,
  IconNewspaperOutline24,
} from 'nucleo-core-outline-24'

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
    const res = await fetch('/api/search?q=&locale=en&limit=20')
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <HeroSection />
        <EmptyState />
      </div>
    )
  }

  const leadArticle = results[0]!
  const sideArticles = results.slice(1, 5)
  const belowFoldArticles = results.slice(5)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <HeroSection />

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-px bg-border mb-10">
        <article className="lg:col-span-3 bg-background">
          <LeadArticleCard article={leadArticle} />
        </article>

        <div className="lg:col-span-2 bg-background flex flex-col">
          {sideArticles.map((article, i) => (
            <article
              key={article.id}
              className={
                i < sideArticles.length - 1
                  ? 'border-b border-border'
                  : ''
              }
            >
              <SideArticleCard article={article} />
            </article>
          ))}
        </div>
      </section>

      {belowFoldArticles.length > 0 ? (
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-foreground pb-2">
            <h2 className="text-xl font-bold tracking-tight uppercase text-foreground">
              {m.home_updated()}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="border-b-[3px] border-double border-foreground pb-4 mb-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-none">
          {m.site_title()}
        </h1>
        <p className="mt-1.5 text-base text-muted-foreground tracking-wide">
          {m.site_tagline()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            <IconMagnifierOutline24 className="w-4 h-4" aria-hidden="true" />
          </div>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={m.search_placeholder()}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="default">
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
      className="group block p-6 lg:p-8 h-full rounded-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
    >
      <span className="inline-block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
        {m.home_recent()}
      </span>

      <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground group-hover:text-primary/80 transition-colors mb-3">
        {article.title || m.untitled()}
      </h2>

      {excerpt ? (
        <p className="text-base text-muted-foreground leading-relaxed mb-5 max-w-prose">
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
      className="group block px-5 py-4 lg:pl-6 rounded-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
    >
      <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary/80 transition-colors mb-1.5 line-clamp-2">
        {article.title || m.untitled()}
      </h3>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {article.verificationScore != null ? (
          <span className="inline-flex items-center gap-1">
            <IconShieldCheckOutline24 className="w-3 h-3" aria-hidden="true" />
            {article.verificationScore}/100
          </span>
        ) : null}

        {formattedDate ? (
          <span className="inline-flex items-center gap-1">
            <IconClockOutline24 className="w-3 h-3" aria-hidden="true" />
            {formattedDate}
          </span>
        ) : null}
      </div>
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
        className="group block border-t border-border pt-4 rounded-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      >
        <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary/80 transition-colors mb-1.5 line-clamp-2">
          {article.title || m.untitled()}
        </h3>

        {excerpt ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
            {excerpt}
          </p>
        ) : null}

        <ArticleMeta article={article} formattedDate={formattedDate} size="sm" />
      </Link>
    </article>
  )
}

function ArticleMeta({
  article,
  formattedDate,
  size = 'base',
}: {
  article: ArticleResult
  formattedDate: string | null
  size?: 'sm' | 'base'
}) {
  const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {article.verificationScore != null ? (
        <span className="inline-flex items-center gap-1">
          <IconShieldCheckOutline24 className={iconClass} aria-hidden="true" />
          {article.verificationScore}/100
        </span>
      ) : null}

      <span className="inline-flex items-center gap-1">
        <IconGlobeOutline24 className={iconClass} aria-hidden="true" />
        {article.locale.toUpperCase()}
      </span>

      {formattedDate ? (
        <span className="inline-flex items-center gap-1">
          <IconClockOutline24 className={iconClass} aria-hidden="true" />
          {m.doc_last_updated({ date: formattedDate })}
        </span>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-5">
        <IconNewspaperOutline24 className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-base font-medium text-foreground mb-1.5">
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
