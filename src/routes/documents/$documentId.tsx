import { createFileRoute, Link } from '@tanstack/react-router'
import {
  IconAlertWarningOutline18,
  IconChevronDownOutline18,
  IconChevronUpOutline18,
  IconCircleCheckOutline18,
  IconClockOutline18,
  IconExternalLinkOutline18,
  IconFlagOutline18,
  IconGlobeOutline18,
  IconQuoteOutline18,
  IconShieldOutline18,
} from 'nucleo-ui-outline-18'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Streamdown } from 'streamdown'
import { RefutationForm } from '#/components/refutation-form'
import { getApiUrl } from '#/lib/get-api-url'
import { rehypeCitationChips } from '#/lib/rehype-citation-chips'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

interface Source {
  snippet?: string
  title?: string
  url: string
}

interface Translation {
  locale: string
  status: string
}

interface DocRefutation {
  category: string
  createdAt: string
  id: string
  selectedText: string
  status: string
  verdict: string | null
}

interface FlaggedClaim {
  notes?: string
  text: string
}

interface DocumentResponse {
  canonicalLocale: string
  content: string | null
  createdAt: string
  id: string
  locale: string
  refutations: DocRefutation[]
  requestedLocale: string
  slug: string
  sources: string | Source[] | null
  status:
    | 'queued'
    | 'generating'
    | 'generated'
    | 'verified'
    | 'flagged'
    | 'failed'
  title: string | null
  topic: string
  translations: Translation[]
  updatedAt: string
  verificationDetails: Record<string, unknown> | FlaggedClaim[] | null
  verificationScore: number | null
}

function parseSources(raw: DocumentResponse['sources']): Source[] {
  if (!raw) {
    return []
  }
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(data)) {
      return []
    }
    return data.filter(
      (s: unknown): s is Source =>
        typeof s === 'object' && s !== null && 'url' in s
    )
  } catch {
    return []
  }
}

function parseFlaggedClaims(
  raw: DocumentResponse['verificationDetails']
): FlaggedClaim[] {
  if (!raw) {
    return []
  }
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw as string) : raw
    if (!Array.isArray(data)) {
      return []
    }
    return data.filter(
      (c: unknown): c is FlaggedClaim =>
        typeof c === 'object' && c !== null && 'text' in c
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

function verdictStyle(verdict: string | null): string {
  if (verdict === 'upheld') {
    return 'bg-[#dbeddb] text-[#1a7f37]'
  }
  if (verdict === 'rejected') {
    return 'bg-muted text-muted-foreground'
  }
  return 'bg-[#fdecc8] text-[#9a6700]'
}

function verdictLabel(verdict: string | null): string | null {
  if (!verdict) {
    return null
  }
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
      `/api/documents/${params.documentId}?locale=${locale}`
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
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="mb-3 font-bold text-3xl text-foreground tracking-tight">
        {m.doc_not_found()}
      </h1>
      <p className="mb-8 text-muted-foreground">{m.doc_not_found_hint()}</p>
      <Link
        className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 font-medium text-card-foreground text-sm outline-none transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        to="/"
      >
        {m.site_title()}
      </Link>
    </div>
  )
}

function GeneratingView({
  title,
  topic,
}: {
  title: string | null
  topic: string
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground text-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-chart-4" />
        {m.status_generating()}
      </div>
      <h1 className="mb-3 font-bold text-3xl text-foreground tracking-tight">
        {title ?? topic}
      </h1>
      <p className="text-muted-foreground">{m.doc_generating_message()}</p>
    </div>
  )
}

function FailedView({ title, topic }: { title: string | null; topic: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-destructive-foreground text-sm">
        <IconAlertWarningOutline18 className="h-4 w-4" />
        {m.status_failed()}
      </div>
      <h1 className="mb-3 font-bold text-3xl text-foreground tracking-tight">
        {title ?? topic}
      </h1>
      <p className="text-muted-foreground">{m.doc_failed_message()}</p>
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
    [doc.verificationDetails]
  )
  const requestedTranslation = doc.translations.find(
    (translation) => translation.locale === requestedLocale
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
    if (formData) {
      return
    }

    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelectionData(null)
      return
    }

    const range = sel.getRangeAt(0)
    const container = contentRef.current
    if (!container?.contains(range.commonAncestorContainer)) {
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
          containerRect.width - 140
        ),
      },
    })
  }, [formData])

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (!selectionData) {
        return
      }
      const target = e.target as Node
      if (floatingBtnRef.current?.contains(target)) {
        return
      }
      setSelectionData(null)
    },
    [selectionData]
  )

  useEffect(() => {
    const container = contentRef.current
    if (!container) {
      return
    }

    container.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleMouseUp, handleClickOutside])

  const openForm = () => {
    if (!selectionData) {
      return
    }
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
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-12">
      <h1 className="mb-2 font-bold text-4xl text-foreground leading-tight tracking-tight">
        {doc.title ?? doc.topic}
      </h1>

      <MetadataBar document={doc} />
      {hasLocaleFallback || isTranslationInProgress ? (
        <LocaleNotice
          hasLocaleFallback={hasLocaleFallback}
          isTranslationInProgress={isTranslationInProgress}
          requestedLocale={requestedLocale}
          shownLocale={doc.locale}
        />
      ) : null}
      {doc.status === 'flagged' && flaggedClaims.length > 0 ? (
        <FlaggedWarning claims={flaggedClaims} />
      ) : null}
      <article
        className="prose prose-neutral dark:prose-invert relative mt-8 max-w-none"
        data-document-content
        ref={contentRef}
      >
        {doc.content ? (
          <Streamdown rehypePlugins={[rehypeCitationChips]}>{doc.content}</Streamdown>
        ) : (
          <p className="text-muted-foreground italic">
            {m.doc_generating_message()}
          </p>
        )}

        {selectionData && !formData ? (
          <button
            className="absolute z-10 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground text-xs shadow-sm outline-none transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={openForm}
            ref={floatingBtnRef}
            style={{
              top: selectionData.rect.top,
              left: selectionData.rect.left,
            }}
            type="button"
          >
            <IconFlagOutline18 className="h-3.5 w-3.5" />
            {m.doc_refute_button()}
          </button>
        ) : null}
      </article>
      {formData ? (
        <RefutationForm
          documentId={doc.id}
          endOffset={formData.endOffset}
          locale={doc.locale}
          onClose={closeForm}
          onSuccess={handleFormSuccess}
          selectedText={formData.text}
          startOffset={formData.startOffset}
        />
      ) : null}

      {sources.length > 0 ? <SourcesSection sources={sources} /> : null}
      <TranslationsSection
        canonicalLocale={doc.canonicalLocale}
        currentLocale={doc.locale}
        documentId={doc.id}
        translations={doc.translations}
      />
      {doc.refutations.length > 0 ? (
        <RefutationsSection refutations={doc.refutations} />
      ) : null}
    </div>
  )
}

function MetadataBar({ document: doc }: { document: DocumentResponse }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs">
      <StatusBadge status={doc.status} />

      {doc.verificationScore !== null ? (
        <span className="inline-flex items-center gap-1.5">
          <IconShieldOutline18 className="h-4 w-4" />
          {m.doc_verification_score({ score: String(doc.verificationScore) })}
        </span>
      ) : null}

      <span className="inline-flex items-center gap-1.5">
        <IconGlobeOutline18 className="h-4 w-4" />
        {doc.locale.toUpperCase()}
      </span>

      <span className="inline-flex items-center gap-1.5">
        <IconClockOutline18 className="h-4 w-4" />
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
  if (!(hasLocaleFallback || isTranslationInProgress)) {
    return null
  }
  return (
    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-foreground text-sm">
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
      icon: <IconCircleCheckOutline18 className="h-3.5 w-3.5" />,
    },
    flagged: {
      label: m.doc_status_flagged(),
      className: 'bg-[#fdecc8] text-[#9a6700]',
      icon: <IconAlertWarningOutline18 className="h-3.5 w-3.5" />,
    },
    failed: {
      label: m.status_failed(),
      className: 'bg-destructive/10 text-destructive-foreground',
    },
  }

  const c = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-medium text-xs ${c.className}`}
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
        <IconAlertWarningOutline18 className="mt-0.5 h-5 w-5 shrink-0 text-chart-4" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground text-sm">
            {m.doc_flagged_warning()}
          </p>
          <button
            aria-expanded={open}
            className="mt-1 inline-flex items-center gap-1 rounded-sm text-muted-foreground text-xs outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => setOpen(!open)}
            type="button"
          >
            {m.doc_flagged_claims()} ({claims.length})
            {open ? (
              <IconChevronUpOutline18 className="h-3 w-3" />
            ) : (
              <IconChevronDownOutline18 className="h-3 w-3" />
            )}
          </button>
          {open ? (
            <ul className="mt-3 space-y-2">
              {claims.map((claim) => (
                <li
                  className="border-chart-4/40 border-l-2 pl-3 text-muted-foreground text-sm"
                  key={claim.text}
                >
                  {claim.text}
                  {claim.notes ? (
                    <span className="mt-0.5 block text-xs opacity-70">
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
    <section className="mt-10 border-border border-t pt-6">
      <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
        <button
          aria-expanded={open}
          className="flex w-full items-center gap-2 rounded-sm text-left outline-none transition-colors hover:text-foreground/80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={() => setOpen(!open)}
          type="button"
        >
          <IconExternalLinkOutline18 className="h-4 w-4" />
          {m.doc_sources()} ({sources.length})
          <span className="ml-auto">
            {open ? (
              <IconChevronUpOutline18 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <IconChevronDownOutline18 className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        </button>
      </h2>
      {open ? (
        <ol className="mt-4 space-y-3">
          {sources.map((source) => (
            <li className="flex gap-3 text-sm" key={source.url}>
              <div className="min-w-0">
                <a
                  className="break-all text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-foreground"
                  href={source.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {source.title || source.url}
                </a>
                {source.snippet ? (
                  <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
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
    <section className="mt-10 border-border border-t pt-6">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
        <IconGlobeOutline18 className="h-4 w-4" />
        {m.doc_available_in()}
      </h2>
      <div className="flex flex-wrap gap-2">
        {allLocales.map((t) => {
          const isCurrent = t.locale === currentLocale
          const isCanonical = t.status === 'canonical'
          return (
            <Link
              className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                isCurrent
                  ? 'bg-accent font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              key={t.locale}
              params={{ documentId }}
              search={{ locale: t.locale }}
              to="/documents/$documentId"
            >
              {t.locale.toUpperCase()}
              {isCanonical ? (
                <span className="text-xs opacity-60">
                  ({m.doc_canonical_label()})
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function RefutationsSection({ refutations }: { refutations: DocRefutation[] }) {
  return (
    <section className="mt-10 border-border border-t pt-6">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
        <IconFlagOutline18 className="h-4 w-4" />
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
      <div className="mb-3 flex gap-2">
        <IconQuoteOutline18 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="line-clamp-3 text-foreground/80 text-sm italic">
          {r.selectedText}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
          {categoryLabel(r.category)}
        </span>

        <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
          {refutationStatusLabel(r.status)}
        </span>

        {verdict ? (
          <span
            className={`rounded-sm px-2 py-0.5 font-medium ${verdictStyle(r.verdict)}`}
          >
            {verdict}
          </span>
        ) : null}

        <span className="ml-auto text-muted-foreground">
          {formatDate(r.createdAt)}
        </span>
      </div>
    </div>
  )
}
