import { useCallback, useEffect, useRef, useState } from "react";

export type GenerationStep =
  | "idle"
  | "researching"
  | "generating"
  | "citing"
  | "scoring"
  | "complete"
  | "error";

export const STEP_LABELS: Record<GenerationStep, string> = {
  idle: "Preparing generation",
  researching: "Researching sources",
  generating: "Writing article",
  citing: "Formatting citations",
  scoring: "Scoring confidence",
  complete: "Generation complete",
  error: "Generation failed",
};

export const STEP_ORDER: GenerationStep[] = [
  "researching",
  "generating",
  "citing",
  "scoring",
  "complete",
];

export type InFlightStep = Exclude<GenerationStep, "idle" | "complete" | "error">;

export const IN_FLIGHT_STEPS: InFlightStep[] = [
  "researching",
  "generating",
  "citing",
  "scoring",
];

type GenerateResponse = {
  slug?: string;
  error?: string;
  result?: {
    slug?: string;
  };
};

const STEP_ADVANCE_INTERVAL_MS = 1800;

function extractSlug(response: GenerateResponse): string | null {
  if (typeof response.slug === "string" && response.slug.length > 0) {
    return response.slug;
  }

  if (typeof response.result?.slug === "string" && response.result.slug.length > 0) {
    return response.result.slug;
  }

  return null;
}

export function useArticleStream(topic: string, locale: string) {
  const [step, setStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startGeneration = useCallback(
    async (signal?: AbortSignal) => {
      clearProgressTimer();
      setError(null);
      setSlug(null);
      setStep("researching");

      timerRef.current = setInterval(() => {
        setStep((current) => {
          const currentIndex = IN_FLIGHT_STEPS.indexOf(current as InFlightStep);
          if (currentIndex < 0 || currentIndex >= IN_FLIGHT_STEPS.length - 1) {
            return current;
          }

          return IN_FLIGHT_STEPS[currentIndex + 1];
        });
      }, STEP_ADVANCE_INTERVAL_MS);

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic, locale }),
          signal,
        });

        const payload = (await response.json().catch(() => ({}))) as GenerateResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Generation failed");
        }

        const generatedSlug = extractSlug(payload);
        if (!generatedSlug) {
          throw new Error("Generation completed without a slug");
        }

        clearProgressTimer();
        setSlug(generatedSlug);
        setStep("complete");
      } catch (err) {
        if (signal?.aborted) {
          return;
        }

        clearProgressTimer();
        setError(err instanceof Error ? err.message : "Generation failed");
        setStep("error");
      }
    },
    [clearProgressTimer, locale, topic]
  );

  useEffect(() => {
    const controller = new AbortController();

    void startGeneration(controller.signal);

    return () => {
      controller.abort();
      clearProgressTimer();
    };
  }, [clearProgressTimer, startGeneration]);

  return { step, error, slug };
}
