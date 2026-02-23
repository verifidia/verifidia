import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import * as m from '#/paraglide/messages'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import {
  IconMagnifierOutline18,
  IconShieldCheckOutline18,
  IconChevronLeftOutline18,
  IconChevronRightOutline18,
  IconGlobeOutline18,
} from 'nucleo-ui-outline-18'
import { getApiUrl } from '#/lib/get-api-url'

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
    const res = await fetch(getApiUrl(`/api/search?${params.toString()}`))
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
    <div className="max-w-[900px] mx-auto px-6 md:px-16 lg:px-24 py-10 md:py-16">
      {q.trim() ? (
        <h2 className="text-lg font-semibold text-foreground mb-4 mt-10">
          {m.search_results_title()}
        </h2>
      ) : null}

      {results.length === 0 && q.trim() ? (
        <EmptyState query={q} locale={locale} />
      ) : (
        <div className="flex flex-col gap-1">
          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </div>
      )}

      {results.length > 0 ? (
        <Pagination page={page} hasMore={hasMore} q={q} locale={locale} />
      ) : null}
    </div>
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
      search={{ locale: undefined }}
      className="group block py-2 px-3 -mx-3 rounded-sm transition-colors duration-75 hover:bg-accent outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
    >
      <h3 className="text-base font-medium text-foreground mb-1">
        {result.title || m.untitled()}
      </h3>

      {result.snippet ? (
        <p className="text-base text-muted-foreground leading-relaxed line-clamp-2 mb-2">
          {result.snippet}
        </p>
      ) : null}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {result.verificationScore != null ? (
          <span className="inline-flex items-center gap-1.5">
            <IconShieldCheckOutline18 className="w-3.5 h-3.5" />
            {m.search_verification_score({ score: String(result.verificationScore) })}
          </span>
        ) : null}

        <span className="inline-flex items-center gap-1.5">
          <IconGlobeOutline18 className="w-3.5 h-3.5" />
          {result.locale.toUpperCase()}
        </span>

        {formattedDate ? (
          <span>{m.doc_last_updated({ date: formattedDate })}</span>
        ) : null}
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
    <nav aria-label="Pagination" className="flex items-center justify-between mt-10 pt-6 border-t border-border">
      {page > 1 ? (
        <Link
          to="/search"
          search={{ q, locale, page: page - 1 }}
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring py-1 px-2 -ml-2"
        >
          <IconChevronLeftOutline18 className="w-4 h-4" />
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
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring py-1 px-2 -mr-2"
        >
          {m.page_next()}
          <IconChevronRightOutline18 className="w-4 h-4" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}

function EmptyState({ query, locale }: { query: string; locale: string }) {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleRequest = async () => {
    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/documents/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: query, locale }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok && data?.documentId) {
        void navigate({
          to: '/documents/$documentId',
          params: { documentId: data.documentId },
        })
        return
      }

      const msg =
        data && typeof data === 'object' && 'error' in data
          ? String(data.error)
          : 'Failed to request article.'
      setErrorMessage(msg)
      setStatus('error')
    } catch {
      setErrorMessage('Failed to request article.')
      setStatus('error')
    }
  }
  return (
    <output className="block text-center py-20 mt-10">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-muted mb-4">
        <IconMagnifierOutline18 className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">
        {m.search_no_results()}
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        {m.search_no_results_hint()}
      </p>
      {session ? (
        <Button
          variant="outline"
          className="rounded-sm"
          disabled={status === 'submitting'}
          onClick={() => void handleRequest()}
        >
          {status === 'submitting' ? m.request_generating() : m.request_button()}
        </Button>
      ) : (
        <Button variant="outline" asChild className="rounded-sm">
          <Link to="/login">{m.auth_sign_in()}</Link>
        </Button>
      )}
      {status === 'error' && errorMessage ? (
        <p className="text-sm text-destructive mt-3">{errorMessage}</p>
      ) : null}
    </output>
  )
}

function SearchSkeleton() {
  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-16 lg:px-24 py-10 md:py-16" aria-busy="true">
      <div className="h-6 w-36 bg-muted rounded-sm mb-4 mt-10 animate-pulse" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((id) => (
          <div
            key={`skeleton-${id}`}
            className="rounded-sm py-2 px-3 -mx-3"
          >
            <div className="h-5 w-2/3 bg-muted rounded-sm mb-2 animate-pulse" />
            <div className="h-4 w-full bg-muted rounded-sm mb-1 animate-pulse" />
            <div className="h-4 w-4/5 bg-muted rounded-sm mb-3 animate-pulse" />
            <div className="flex gap-4">
              <div className="h-3.5 w-24 bg-muted rounded-sm animate-pulse" />
              <div className="h-3.5 w-12 bg-muted rounded-sm animate-pulse" />
              <div className="h-3.5 w-32 bg-muted rounded-sm animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
