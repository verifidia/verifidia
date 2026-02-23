import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  IconChevronLeftOutline18,
  IconChevronRightOutline18,
  IconGlobeOutline18,
  IconMagnifierOutline18,
  IconShieldCheckOutline18,
} from 'nucleo-ui-outline-18'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { authClient } from '#/lib/auth-client'
import { getApiUrl } from '#/lib/get-api-url'
import { m } from '#/paraglide/messages'

const LIMIT = 20

const searchSchema = z.object({
  q: z.string().optional().default(''),
  locale: z.string().optional().default('en'),
  page: z.number().optional().default(1),
})

interface SearchResult {
  id: string
  locale: string
  snippet: string
  title: string
  updatedAt: string | null
  verificationScore: number | null
}

export const Route = createFileRoute('/search')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    q: search.q,
    locale: search.locale,
    page: search.page,
  }),
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
    <div className="mx-auto max-w-[900px] px-6 py-10 md:px-16 md:py-16 lg:px-24">
      {q.trim() ? (
        <h2 className="mt-10 mb-4 font-semibold text-foreground text-lg">
          {m.search_results_title()}
        </h2>
      ) : null}

      {results.length === 0 && q.trim() ? (
        <EmptyState locale={locale} query={q} />
      ) : (
        <div className="flex flex-col gap-1">
          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </div>
      )}

      {results.length > 0 ? (
        <Pagination hasMore={hasMore} locale={locale} page={page} q={q} />
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
      className="group -mx-3 block rounded-sm px-3 py-2 outline-none transition-colors duration-75 hover:bg-accent focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
      params={{ documentId: result.id }}
      search={{ locale: undefined }}
      to="/$documentId"
    >
      <h3 className="mb-1 font-medium text-base text-foreground">
        {result.title || m.untitled()}
      </h3>

      {result.snippet ? (
        <p className="mb-2 line-clamp-2 text-base text-muted-foreground leading-relaxed">
          {result.snippet}
        </p>
      ) : null}

      <div className="flex items-center gap-4 text-muted-foreground text-xs">
        {result.verificationScore != null ? (
          <span className="inline-flex items-center gap-1.5">
            <IconShieldCheckOutline18 className="h-3.5 w-3.5" />
            {m.search_verification_score({
              score: String(result.verificationScore),
            })}
          </span>
        ) : null}

        <span className="inline-flex items-center gap-1.5">
          <IconGlobeOutline18 className="h-3.5 w-3.5" />
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
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-between border-border border-t pt-6"
    >
      {page > 1 ? (
        <Link
          className="-ml-2 inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-medium text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
          search={{ q, locale, page: page - 1 }}
          to="/search"
        >
          <IconChevronLeftOutline18 className="h-4 w-4" />
          {m.page_previous()}
        </Link>
      ) : (
        <div />
      )}

      <span className="text-muted-foreground text-sm">
        {m.page_indicator({ page: String(page) })}
      </span>

      {hasMore ? (
        <Link
          className="-mr-2 inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-medium text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-ring"
          search={{ q, locale, page: page + 1 }}
          to="/search"
        >
          {m.page_next()}
          <IconChevronRightOutline18 className="h-4 w-4" />
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
        navigate({
          to: '/$documentId',
          params: { documentId: data.documentId },
          search: { locale: undefined },
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
    <output className="mt-10 block py-20 text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-sm bg-muted">
        <IconMagnifierOutline18 className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mb-1 font-medium text-base text-foreground">
        {m.search_no_results()}
      </p>
      <p className="mb-6 text-muted-foreground text-sm">
        {m.search_no_results_hint()}
      </p>
      {session ? (
        <Button
          className="rounded-sm"
          disabled={status === 'submitting'}
          onClick={() => {
            handleRequest()
          }}
          variant="outline"
        >
          {status === 'submitting'
            ? m.request_generating()
            : m.request_button()}
        </Button>
      ) : (
        <Button asChild className="rounded-sm" variant="outline">
          <Link to="/login">{m.auth_sign_in()}</Link>
        </Button>
      )}
      {status === 'error' && errorMessage ? (
        <p className="mt-3 text-destructive text-sm">{errorMessage}</p>
      ) : null}
    </output>
  )
}

function SearchSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto max-w-[900px] px-6 py-10 md:px-16 md:py-16 lg:px-24"
    >
      <div className="mt-10 mb-4 h-6 w-36 animate-pulse rounded-sm bg-muted" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((id) => (
          <div className="-mx-3 rounded-sm px-3 py-2" key={`skeleton-${id}`}>
            <div className="mb-2 h-5 w-2/3 animate-pulse rounded-sm bg-muted" />
            <div className="mb-1 h-4 w-full animate-pulse rounded-sm bg-muted" />
            <div className="mb-3 h-4 w-4/5 animate-pulse rounded-sm bg-muted" />
            <div className="flex gap-4">
              <div className="h-3.5 w-24 animate-pulse rounded-sm bg-muted" />
              <div className="h-3.5 w-12 animate-pulse rounded-sm bg-muted" />
              <div className="h-3.5 w-32 animate-pulse rounded-sm bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
