import type { Element } from 'hast'
import { IconExternalLinkOutline18 } from 'nucleo-ui-outline-18'
import { createContext, useContext } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '#/components/ui/hover-card'

interface Source {
  snippet?: string
  title?: string
  url: string
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
const SourcesContext = createContext<Source[]>([])

function CitationSpan({
  className,
  children,
  node,
  ...props
}: React.ComponentProps<'span'> & { node?: Element }) {
  const sources = useContext(SourcesContext)

  if (typeof className !== 'string' || !className.includes('citation-chip')) {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    )
  }

  const citationNum =
    node?.properties?.dataCitation ??
    (typeof children === 'string' ? children : null)
  const sourceIndex = Number(citationNum) - 1
  const source = sources[sourceIndex]

  if (!source) {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    )
  }

  return (
    <HoverCard closeDelay={100} openDelay={200}>
      <HoverCardTrigger asChild>
        <span className={className} role="doc-noteref" tabIndex={0} {...props}>
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-72 space-y-2 p-3"
        side="top"
        sideOffset={6}
      >
        <p className="line-clamp-2 font-medium text-foreground text-sm leading-snug">
          {source.title || getHostname(source.url)}
        </p>
        {source.snippet ? (
          <p className="line-clamp-3 text-muted-foreground text-xs leading-relaxed">
            {source.snippet}
          </p>
        ) : null}
        <a
          className="inline-flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
          href={source.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <IconExternalLinkOutline18 className="h-3 w-3 shrink-0" />
          <span className="truncate">{getHostname(source.url)}</span>
        </a>
      </HoverCardContent>
    </HoverCard>
  )
}

const citationComponents = {
  span: CitationSpan,
} as const

export { SourcesContext, citationComponents }
