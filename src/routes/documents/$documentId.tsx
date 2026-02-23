import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Streamdown } from 'streamdown'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'
import { RefutationForm } from '#/components/RefutationForm'
import {
  IconCircleCheckOutline18,
  IconAlertWarningOutline18,
  IconExternalLinkOutline18,
  IconGlobeOutline18,
  IconChevronDownOutline18,
  IconChevronUpOutline18,
  IconClockOutline18,
  IconShieldOutline18,
  IconQuoteOutline18,
  IconFlagOutline18,
} from 'nucleo-ui-outline-18'
import { getApiUrl } from '#/lib/get-api-url'

interface Source {
  url: string
  title?: string
  snippet?: string
}

interface Translation {
  locale: string
  status: string
}

interface DocRefutation {
  id: string
  category: string
  selectedText: string
  status: string
  verdict: string | null
  createdAt: string
}

interface FlaggedClaim {
  text: string
  notes?: string
}

interface DocumentResponse {
  id: string
  slug: string
  topic: string
  title: string | null
  content: string | null
  locale: string
  requestedLocale: string
  canonicalLocale: string
  status: 'queued' | 'generating' | 'generated' | 'verified' | 'flagged' | 'failed'
  verificationScore: number | null
  verificationDetails: Record<string, {}> | FlaggedClaim[] | null
  sources: string | Source[] | null
  translations: Translation[]
  refutations: DocRefutation[]
  createdAt: string
  updatedAt: string
}

function parseSources(raw: DocumentResponse['sources']): Source[] {
  if (!raw) return []
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(data)) return []
    return data.filter(
      (s: unknown): s is Source =>
        typeof s === 'object' && s !== null && 'url' in s,
    )
  } catch {
    return []
  }
}

function parseFlaggedClaims(raw: DocumentResponse['verificationDetails']): FlaggedClaim[] {
  if (!raw) return []
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw as string) : raw
    if (!Array.isArray(data)) return []
    return data.filter(
      (c: unknown): c is FlaggedClaim =>
        typeof c === 'object' && c !== null && 'text' in c,
    )
  } catch {
    return []
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function categoryLabel(category: string): string {
  const map: Record<string, () => string> = {
    factual_error: m.doc_refute_category_factual,
    outdated: m.doc_refute_category_outdated,
    biased: m.doc_refute_category_biased,
    missing_context: m.doc_refute_category_missing,
  }
  return map[category]?.() ?? category
}

function verdictLabel(verdict: string | null): string | null {
  if (!verdict) return null
  const map: Record<string, () => string> = {
    upheld: m.refute_verdict_upheld,
    partially_upheld: m.refute_verdict_partially_upheld,
    rejected: m.refute_verdict_rejected,
  }
  return map[verdict]?.() ?? verdict
}

function refutationStatusLabel(status: string): string {
  const map: Record<string, () => string> = {
    pending: m.refute_status_pending,
    processing: m.refute_status_processing,
    reviewed: m.refute_status_reviewed,
    applied: m.refute_status_applied,
  }
  return map[status]?.() ?? status
}

export const Route = createFileRoute('/documents/$documentId')({
  validateSearch: (search: Record<string, unknown>) => ({
    locale: (search.locale as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({ locale: search.locale }),
  loader: async ({ params, deps }) => {
    const locale = deps.locale || getLocale()
    const url = getApiUrl(
      `/api/documents/${params.documentId}?locale=${locale}`,
    )
    const res = await fetch(url)
    if (res.status === 404) {
      return { notFound: true as const }
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch document: ${res.status}`)
    }
    const data: DocumentResponse = await res.json()
    return { notFound: false as const, document: data }
  },
  component: DocumentPage,
})

function DocumentPage() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()

  if (data.notFound) {
    return <NotFoundView />
  }

  const doc = data.document
  const status = doc.status

  if (status === 'queued' || status === 'generating') {
    return <GeneratingView title={doc.title} topic={doc.topic} />
  }

  if (status === 'failed') {
    return <FailedView title={doc.title} topic={doc.topic} />
  }

  const requestedLocale = search.locale || getLocale()

  return <DocumentView document={doc} requestedLocale={requestedLocale} />
}

function NotFoundView() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight mb-3 text-foreground">
        {m.doc_not_found()}
      </h1>
      <p className="text-muted-foreground mb-8">
        {m.doc_not_found_hint()}
      </p>
      <Link
        to="/"
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-border bg-card text-card-foreground hover:bg-accent transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      >
        {m.site_title()}
      </Link>
    </div>
  )
}

function GeneratingView({ title, topic }: { title: string | null; topic: string }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-6">
        <span className="w-2 h-2 rounded-full bg-chart-4 animate-pulse" />
        {m.status_generating()}
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3 text-foreground">
        {title ?? topic}
      </h1>
      <p className="text-muted-foreground">
        {m.doc_generating_message()}
      </p>
    </div>
  )
}

function FailedView({ title, topic }: { title: string | null; topic: string }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive-foreground text-sm mb-6">
        <IconAlertWarningOutline18 className="w-4 h-4" />
        {m.status_failed()}
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3 text-foreground">
        {title ?? topic}
      </h1>
      <p className="text-muted-foreground">
        {m.doc_failed_message()}
      </p>
    </div>
  )
}

function DocumentView({
  document: doc,
  requestedLocale,
}: {
  document: DocumentResponse
  requestedLocale: string
}) {
  const sources = useMemo(() => parseSources(doc.sources), [doc.sources])
  const flaggedClaims = useMemo(
    () => parseFlaggedClaims(doc.verificationDetails),
    [doc.verificationDetails],
  )
  const requestedTranslation = doc.translations.find(
    (translation) => translation.locale === requestedLocale,
  )
  const hasLocaleFallback = doc.locale !== requestedLocale
  const isTranslationInProgress = requestedTranslation?.status === 'translating'
  const contentRef = useRef<HTMLElement>(null)
  const floatingBtnRef = useRef<HTMLButtonElement>(null)

  const [selectionData, setSelectionData] = useState<{
    text: string
    startOffset: number
    endOffset: number
    rect: { top: number; left: number }
  } | null>(null)

  const [formData, setFormData] = useState<{
    text: string
    startOffset: number
    endOffset: number
  } | null>(null)

  const handleMouseUp = useCallback(() => {
    if (formData) return

    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelectionData(null)
      return
    }

    const range = sel.getRangeAt(0)
    const container = contentRef.current
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setSelectionData(null)
      return
    }

    const text = sel.toString().trim()
    if (!text) {
      setSelectionData(null)
      return
    }

    // Calculate offsets relative to the container text content
    const preRange = document.createRange()
    preRange.selectNodeContents(container)
    preRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = preRange.toString().length
    const endOffset = startOffset + text.length

    const rect = range.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    setSelectionData({
      text,
      startOffset,
      endOffset,
      rect: {
        top: rect.bottom - containerRect.top + 8,
        left: Math.min(
          rect.left - containerRect.left,
          containerRect.width - 140,
        ),
      },
    })
  }, [formData])

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (!selectionData) return
      const target = e.target as Node
      if (floatingBtnRef.current?.contains(target)) return
      setSelectionData(null)
    },
    [selectionData],
  )

  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    container.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleMouseUp, handleClickOutside])

  const openForm = () => {
    if (!selectionData) return
    setFormData({
      text: selectionData.text,
      startOffset: selectionData.startOffset,
      endOffset: selectionData.endOffset,
    })
    setSelectionData(null)
    window.getSelection()?.removeAllRanges()
  }

  const closeForm = () => {
    setFormData(null)
  }

  const handleFormSuccess = () => {
    setFormData(null)
  }
  return (
    <div className="max-w-[720px] mx-auto px-6 md:px-16 lg:px-24 py-10 md:py-16">
      <h1 className="text-[40px] font-bold leading-tight tracking-tight mb-2 text-foreground">
        {doc.title ?? doc.topic}
      </h1>

      <MetadataBar document={doc} />
      {hasLocaleFallback || isTranslationInProgress ? (
        <LocaleNotice
          shownLocale={doc.locale}
          requestedLocale={requestedLocale}
          hasLocaleFallback={hasLocaleFallback}
          isTranslationInProgress={isTranslationInProgress}
        />
      ) : null}
      {doc.status === 'flagged' && flaggedClaims.length > 0 ? (
        <FlaggedWarning claims={flaggedClaims} />
      ) : null}
      <article
        ref={contentRef}
        data-document-content
        className="relative mt-8 prose prose-neutral dark:prose-invert max-w-none"
      >
        {doc.content ? (
          <Streamdown>{doc.content}</Streamdown>
        ) : (
          <p className="text-muted-foreground italic">
            {m.doc_generating_message()}
          </p>
        )}

        {selectionData && !formData ? (
          <button
            ref={floatingBtnRef}
            type="button"
            onClick={openForm}
            className="absolute z-10 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-accent transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            style={{
              top: selectionData.rect.top,
              left: selectionData.rect.left,
            }}
          >
            <IconFlagOutline18 className="w-3.5 h-3.5" />
            {m.doc_refute_button()}
          </button>
        ) : null}
      </article>
      {formData ? (
        <RefutationForm
          documentId={doc.id}
          locale={doc.locale}
          selectedText={formData.text}
          startOffset={formData.startOffset}
          endOffset={formData.endOffset}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
        />
      ) : null}

      {sources.length > 0 ? <SourcesSection sources={sources} /> : null}
      <TranslationsSection
        translations={doc.translations}
        currentLocale={doc.locale}
        canonicalLocale={doc.canonicalLocale}
        documentId={doc.id}
      />
      {doc.refutations.length > 0 ? (
        <RefutationsSection refutations={doc.refutations} />
      ) : null}
    </div>
  )
}

function MetadataBar({ document: doc }: { document: DocumentResponse }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <StatusBadge status={doc.status} />

      {doc.verificationScore !== null ? (
        <span className="inline-flex items-center gap-1.5">
          <IconShieldOutline18 className="w-4 h-4" />
          {m.doc_verification_score({ score: String(doc.verificationScore) })}
        </span>
      ) : null}

      <span className="inline-flex items-center gap-1.5">
        <IconGlobeOutline18 className="w-4 h-4" />
        {doc.locale.toUpperCase()}
      </span>

      <span className="inline-flex items-center gap-1.5">
        <IconClockOutline18 className="w-4 h-4" />
        {m.doc_last_updated({ date: formatDate(doc.updatedAt) })}
      </span>
    </div>
  )
}

function LocaleNotice({
  shownLocale,
  requestedLocale,
  hasLocaleFallback,
  isTranslationInProgress,
}: {
  shownLocale: string
  requestedLocale: string
  hasLocaleFallback: boolean
  isTranslationInProgress: boolean
}) {
  if (!hasLocaleFallback && !isTranslationInProgress) {
    return null
  }
  return (
    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
      <p className="inline-flex items-center gap-2">
        <IconGlobeOutline18 className="h-4 w-4 shrink-0" />
        {isTranslationInProgress
          ? m.doc_translation_in_progress()
          : m.doc_fallback_notice({
              shownLocale: shownLocale.toUpperCase(),
              requestedLocale: requestedLocale.toUpperCase(),
            })}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: DocumentResponse['status'] }) {
  const config: Record<
    DocumentResponse['status'],
    { label: string; className: string; icon?: React.ReactNode }
  > = {
    queued: {
      label: m.status_queued(),
      className: 'bg-muted text-muted-foreground',
    },
    generating: {
      label: m.status_generating(),
      className: 'bg-muted text-muted-foreground',
    },
    generated: {
      label: m.doc_status_generated(),
      className: 'bg-muted text-muted-foreground',
    },
    verified: {
      label: m.doc_status_verified(),
      className: 'bg-[#dbeddb] text-[#1a7f37]',
      icon: <IconCircleCheckOutline18 className="w-3.5 h-3.5" />,
    },
    flagged: {
      label: m.doc_status_flagged(),
      className: 'bg-[#fdecc8] text-[#9a6700]',
      icon: <IconAlertWarningOutline18 className="w-3.5 h-3.5" />,
    },
    failed: {
      label: m.status_failed(),
      className: 'bg-destructive/10 text-destructive-foreground',
    },
  }

  const c = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm text-xs font-medium ${c.className}`}
    >
      {c.icon}
      {c.label}
    </span>
  )
}

function FlaggedWarning({ claims }: { claims: FlaggedClaim[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-4 rounded-lg border border-chart-4/30 bg-chart-4/5 p-4">
      <div className="flex items-start gap-3">
        <IconAlertWarningOutline18 className="w-5 h-5 text-chart-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {m.doc_flagged_warning()}
          </p>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            {m.doc_flagged_claims()} ({claims.length})
            {open ? (
              <IconChevronUpOutline18 className="w-3 h-3" />
            ) : (
              <IconChevronDownOutline18 className="w-3 h-3" />
            )}
          </button>
          {open ? (
            <ul className="mt-3 space-y-2">
              {claims.map((claim) => (
                <li
                  key={claim.text}
                  className="text-sm text-muted-foreground pl-3 border-l-2 border-chart-4/40"
                >
                  {claim.text}
                  {claim.notes ? (
                    <span className="block text-xs mt-0.5 opacity-70">
                      {claim.notes}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SourcesSection({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex items-center gap-2 w-full text-left hover:text-foreground/80 transition-colors rounded-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <IconExternalLinkOutline18 className="w-4 h-4" />
          {m.doc_sources()} ({sources.length})
          <span className="ml-auto">
            {open ? (
              <IconChevronUpOutline18 className="w-4 h-4 text-muted-foreground" />
            ) : (
              <IconChevronDownOutline18 className="w-4 h-4 text-muted-foreground" />
            )}
          </span>
        </button>
      </h2>
      {open ? (
        <ol className="mt-4 space-y-3">
          {sources.map((source) => (
            <li key={source.url} className="flex gap-3 text-sm">
              <div className="min-w-0">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 decoration-border hover:decoration-foreground transition-colors break-all"
                >
                  {source.title || source.url}
                </a>
                {source.snippet ? (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {source.snippet}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}

function TranslationsSection({
  translations,
  currentLocale,
  canonicalLocale,
  documentId,
}: {
  translations: Translation[]
  currentLocale: string
  canonicalLocale: string
  documentId: string
}) {
  // Build list: canonical locale first, then translations (excluding canonical)
  const allLocales = [
    { locale: canonicalLocale, status: 'canonical' },
    ...translations.filter((t) => t.locale !== canonicalLocale),
  ]

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        <IconGlobeOutline18 className="w-4 h-4" />
        {m.doc_available_in()}
      </h2>
      <div className="flex flex-wrap gap-2">
        {allLocales.map((t) => {
          const isCurrent = t.locale === currentLocale
          const isCanonical = t.status === 'canonical'
          return (
            <Link
              key={t.locale}
              to="/documents/$documentId"
              params={{ documentId }}
              search={{ locale: t.locale }}
              className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ${
                isCurrent
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {t.locale.toUpperCase()}
              {isCanonical ? (
                <span className="text-xs opacity-60">({m.doc_canonical_label()})</span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function RefutationsSection({
  refutations,
}: {
  refutations: DocRefutation[]
}) {
  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        <IconFlagOutline18 className="w-4 h-4" />
        {m.doc_refutations()} ({refutations.length})
      </h2>
      <div className="space-y-4">
        {refutations.map((r) => (
          <RefutationCard key={r.id} refutation={r} />
        ))}
      </div>
    </section>
  )
}

function RefutationCard({ refutation: r }: { refutation: DocRefutation }) {
  const verdict = verdictLabel(r.verdict)

  return (
    <div className="rounded-sm bg-muted p-4">
      <div className="flex gap-2 mb-3">
        <IconQuoteOutline18 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-foreground/80 italic line-clamp-3">
          {r.selectedText}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {categoryLabel(r.category)}
        </span>

        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {refutationStatusLabel(r.status)}
        </span>

        {verdict ? (
          <span
            className={`px-2 py-0.5 rounded-sm font-medium ${
              r.verdict === 'upheld'
                ? 'bg-[#dbeddb] text-[#1a7f37]'
                : r.verdict === 'rejected'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-[#fdecc8] text-[#9a6700]'
            }`}
          >
            {verdict}
          </span>
        ) : null}

        <span className="text-muted-foreground ml-auto">
          {formatDate(r.createdAt)}
        </span>
      </div>
    </div>
  )
}
