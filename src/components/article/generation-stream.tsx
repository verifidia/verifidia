"use client";

import { useEffect } from "react";
import { IconCheckFill18, IconLoaderFill18 } from "nucleo-ui-fill-18";
import { useLocale } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IN_FLIGHT_STEPS,
  STEP_LABELS,
  type InFlightStep,
  type GenerationStep,
  useArticleStream,
} from "@/hooks/use-article-stream";
import { useRouter } from "@/i18n/routing";

type GenerationStreamProps = {
  topic: string;
};

function getActiveStepIndex(step: GenerationStep) {
  if (step === "complete") {
    return IN_FLIGHT_STEPS.length;
  }

  return IN_FLIGHT_STEPS.indexOf(step as InFlightStep);
}

export function GenerationStream({ topic }: GenerationStreamProps) {
  const locale = useLocale();
  const router = useRouter();
  const { step, error, slug } = useArticleStream(topic, locale);

  useEffect(() => {
    if (step === "complete" && slug) {
      router.push(`/article/${slug}`);
    }
  }, [router, slug, step]);

  const activeStepIndex = getActiveStepIndex(step);
  const isGenerating = step !== "complete" && step !== "error";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="relative w-full overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-6 shadow-2xl sm:p-8">


        <div className="relative">
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Now generating</p>
          <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {topic}
          </h1>

          <div className="mt-8 space-y-4">
            {IN_FLIGHT_STEPS.map((progressStep, index) => {
              const isDone = activeStepIndex > index;
              const isActive = activeStepIndex === index && isGenerating;

              return (
                <div key={progressStep} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                      isDone
                        ? "border-trust bg-trust/10 text-trust"
                        : isActive
                          ? "border-trust/60 bg-trust/8 text-trust"
                          : "border-border text-muted-foreground"
                    }`}
                    aria-hidden
                  >
                    {isDone ? <IconCheckFill18 className="h-4 w-4" /> : isActive ? <IconLoaderFill18 className="h-4 w-4 animate-spin" /> : index + 1}
                  </span>

                  <p
                    className={
                      isDone || isActive ? "font-medium text-foreground" : "text-muted-foreground"
                    }
                  >
                    {STEP_LABELS[progressStep]}
                  </p>
                </div>
              );
            })}
          </div>

          {isGenerating ? (
            <div className="mt-8 space-y-3 rounded-2xl border border-dashed border-border/70 bg-background/55 p-4">
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : null}

          {step === "complete" && slug ? (
            <p className="mt-8 text-sm text-muted-foreground">{STEP_LABELS.complete}. Opening article...</p>
          ) : null}

          {step === "error" ? (
            <div className="mt-8 rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              <p className="font-medium">{STEP_LABELS.error}</p>
              <p className="mt-1">{error ?? "Something went wrong during generation."}</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
