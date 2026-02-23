import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import * as m from '#/paraglide/messages'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import {
  IconMagnifierOutline24,
  IconShieldCheckOutline24,
  IconChevronLeftOutline24,
  IconChevronRightOutline24,
  IconGlobeOutline24,
} from 'nucleo-core-outline-24'

const LIMIT = 20

const searchSchema = z.object({
  q: z.string().optional().default(''),
  locale: z.string().optional().default('en'),
  page: z.number().optional().default(1),
})

type SearchResult = {
  id: string
  title: string
  snippet: string
  locale: string
  verificationScore: number | null
  updatedAt: string | null
}

export const Route = createFileRoute('/search')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ q: search.q, locale: search.locale, page: search.page }),
  loader: async ({ deps: { q, locale, page } }) => {
    const offset = (page - 1) * LIMIT
    const params = new URLSearchParams({
      q,
      locale,
      limit: String(LIMIT),
      offset: String(offset),
    })
    const res = await fetch(`/api/search?${params.toString()}`)
    if (!res.ok) {
      return { results: [] as SearchResult[] }
    }
    const data = (await res.json()) as { results: SearchResult[] }
    return { results: data.results }
  },
  component: SearchPage,
  pendingComponent: SearchSkeleton,
})

function SearchPage() {
  const { results } = Route.useLoaderData()
  const { q, page, locale } = Route.useSearch()
  const hasMore = results.length === LIMIT

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <SearchInput defaultValue={q} />

      {q.trim() && (
        <h2 className="text-lg font-semibold tracking-tight text-foreground mb-6">
          {m.search_results_title()}
        </h2>
      )}

      {results.length === 0 && q.trim() ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <Pagination page={page} hasMore={hasMore} q={q} locale={locale} />
      )}
    </div>
  )
}

function SearchInput({ defaultValue }: { defaultValue: string }) {
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = (formData.get('q') as string) ?? ''
    navigate({ to: '/search', search: { q: query.trim() } })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            <IconMagnifierOutline24 className="w-4 h-4" />
          </div>
          <Input
            type="search"
            name="q"
            defaultValue={defaultValue}
            placeholder={m.search_placeholder()}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="default">
          {m.search_button()}
        </Button>
      </div>
    </form>
  )
}

function ResultCard({ result }: { result: SearchResult }) {
  const formattedDate = result.updatedAt
    ? new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(result.updatedAt))
    : null

  return (
    <Link
      to="/documents/$documentId"
      params={{ documentId: result.id }}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-ring/50 hover:bg-accent/30"
    >
      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">
        {result.title || 'Untitled'}
      </h3>

      {result.snippet && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {result.snippet}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {result.verificationScore != null && (
          <span className="inline-flex items-center gap-1">
            <IconShieldCheckOutline24 className="w-3.5 h-3.5" />
            {m.search_verification_score({ score: String(result.verificationScore) })}
          </span>
        )}

        <span className="inline-flex items-center gap-1">
          <IconGlobeOutline24 className="w-3.5 h-3.5" />
          {result.locale.toUpperCase()}
        </span>

        {formattedDate && (
          <span>{m.doc_last_updated({ date: formattedDate })}</span>
        )}
      </div>
    </Link>
  )
}

function Pagination({
  page,
  hasMore,
  q,
  locale,
}: {
  page: number
  hasMore: boolean
  q: string
  locale: string
}) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
      {page > 1 ? (
        <Link
          to="/search"
          search={{ q, locale, page: page - 1 }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconChevronLeftOutline24 className="w-4 h-4" />
          {m.page_previous()}
        </Link>
      ) : (
        <div />
      )}

      <span className="text-sm text-muted-foreground">
        {m.page_indicator({ page: String(page) })}
      </span>

      {hasMore ? (
        <Link
          to="/search"
          search={{ q, locale, page: page + 1 }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {m.page_next()}
          <IconChevronRightOutline24 className="w-4 h-4" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <IconMagnifierOutline24 className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">
        {m.search_no_results()}
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        {m.search_no_results_hint()}
      </p>
      <Button variant="outline" asChild>
        <Link to="/">{m.request_button()}</Link>
      </Button>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-muted rounded-md animate-pulse" />
          <div className="w-20 h-9 bg-muted rounded-md animate-pulse" />
        </div>
      </div>
      <div className="h-6 w-36 bg-muted rounded mb-6 animate-pulse" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="h-5 w-2/3 bg-muted rounded mb-2 animate-pulse" />
            <div className="h-4 w-full bg-muted rounded mb-1 animate-pulse" />
            <div className="h-4 w-4/5 bg-muted rounded mb-3 animate-pulse" />
            <div className="flex gap-4">
              <div className="h-3.5 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3.5 w-12 bg-muted rounded animate-pulse" />
              <div className="h-3.5 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
