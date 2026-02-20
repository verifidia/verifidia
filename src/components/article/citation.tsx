"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ArticleCitation } from "@/types/article";

type CitationProps = {
  index: number;
  citation: ArticleCitation;
};

export function Citation({ index, citation }: CitationProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <sup className="ml-1 align-super text-[0.75rem] leading-none">
            <a
              href={`#ref-${index}`}
              className="font-medium text-[var(--color-trust)] no-underline hover:underline"
              aria-label={`Reference ${index}`}
            >
              [{index}]
            </a>
          </sup>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={8}
          className="max-w-xs bg-card text-card-foreground shadow-lg"
        >
          <p className="text-xs leading-relaxed">{citation.text}</p>
          <a
            href={citation.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-xs font-medium text-[var(--color-trust)] underline decoration-dotted underline-offset-2"
          >
            {citation.url}
          </a>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
