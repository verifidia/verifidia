"use client";

import { type ReactNode, useState } from "react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";

type RefutableParagraphProps = {
  articleId: string;
  sectionIndex: number;
  paragraphIndex: number;
  children: ReactNode;
};

export function RefutableParagraph({
  articleId,
  sectionIndex,
  paragraphIndex,
  children,
}: RefutableParagraphProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const blockIndex = sectionIndex * 1000 + paragraphIndex;

  const submit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSubmitting(true);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId,
        blockIndex,
        feedbackType: "block_feedback",
        content: trimmed,
      }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      setContent("");
      setOpen(false);
      setSubmitted(true);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <p
          className={[
            "cursor-pointer rounded-sm px-1 -mx-1 transition-colors duration-150",
            open
              ? "bg-muted"
              : "hover:bg-muted/60",
          ].join(" ")}
        >
          {children}
        </p>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50 w-80 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {submitted ? (
            <p className="text-xs text-muted-foreground">Thanks for your feedback.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Refute this paragraph
              </p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe what's inaccurate or misleading"
                className="focus-visible:ring-ring/50 min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void submit()}
                  disabled={isSubmitting || !content.trim()}
                >
                  {isSubmitting ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
