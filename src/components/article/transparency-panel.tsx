"use client";

import { useState } from "react";
import { IconChevronDownFill18, IconChevronUpFill18, IconCircleInfoFill18 } from "nucleo-ui-fill-18";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getModelDisplayName } from "@/lib/model-display";

interface Source {
  title: string;
  url: string;
  snippet?: string;
}

interface TransparencyPanelProps {
  modelUsed: string;
  systemPromptUsed: string;
  sourcesConsulted: Source[];
  confidenceScore: number;
  generationTimeMs: number;
  generatedAt: Date | string;
  locale: string;
}

export function TransparencyPanel({
  modelUsed,
  systemPromptUsed,
  sourcesConsulted,
  confidenceScore,
  generationTimeMs,
  generatedAt,
  locale,
}: TransparencyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const confidencePct = Math.round(confidenceScore * 100);
  const confidenceColor =
    confidenceScore >= 0.8
      ? "bg-green-500"
      : confidenceScore >= 0.7
        ? "bg-yellow-500"
        : "bg-red-500";
  const generationSecs = (generationTimeMs / 1000).toFixed(1);
  const generatedDate = new Date(generatedAt).toLocaleString(locale);

  return (
    <div className="my-4 overflow-hidden rounded-lg border">
      <Button
        variant="ghost"
        className="flex h-auto w-full items-center justify-between p-4"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 font-medium">
          <IconCircleInfoFill18 className="h-4 w-4" />
          How was this made?
        </span>
        {isOpen ? (
          <IconChevronUpFill18 className="h-4 w-4" />
        ) : (
          <IconChevronDownFill18 className="h-4 w-4" />
        )}
      </Button>

      {isOpen ? (
        <div className="space-y-4 border-t px-4 pb-4">
          <div>
            <h4 className="mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Model
            </h4>
            <p className="text-sm">{getModelDisplayName(modelUsed)}</p>
          </div>

          <div>
            <h4 className="mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Confidence Score - {confidencePct}%
            </h4>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full ${confidenceColor}`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>

          <div>
            <h4 className="mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Verification Time
            </h4>
            <p className="text-sm">
              Verified in {generationSecs} seconds on {generatedDate}
            </p>
          </div>

          {sourcesConsulted.length > 0 ? (
            <div>
              <h4 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Sources Consulted ({sourcesConsulted.length})
              </h4>
              <ul className="space-y-1">
                {sourcesConsulted.map((source) => (
                  <li key={source.url} className="text-sm">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {source.title || source.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompt(!showPrompt)}
              className="h-auto p-0 text-sm text-muted-foreground"
            >
              {showPrompt ? "Hide" : "Show"} system prompt
            </Button>
            {showPrompt ? (
              <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">
                {systemPromptUsed}
              </pre>
            ) : null}
          </div>

          <Badge variant="outline" className="text-xs">
            Verified in {locale.toUpperCase()}
          </Badge>
        </div>
      ) : null}
    </div>
  );
}
