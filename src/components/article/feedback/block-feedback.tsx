"use client";

import { useState } from "react";
import { IconFlagFill18 } from "nucleo-ui-fill-18";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";

type BlockFeedbackProps = {
  articleId: string;
  blockIndex: number;
};

type BlockFeedbackType = "block_feedback" | "thumbs_down" | "thumbs_up";

const feedbackTypeLabels: Record<BlockFeedbackType, string> = {
  block_feedback: "Inaccurate or unclear",
  thumbs_down: "Needs improvement",
  thumbs_up: "Helpful section",
};

export function BlockFeedback({ articleId, blockIndex }: BlockFeedbackProps) {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<BlockFeedbackType>("block_feedback");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setIsSubmitting(true);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        articleId,
        blockIndex,
        feedbackType,
        content: content.trim() || undefined,
      }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      setContent("");
      setFeedbackType("block_feedback");
      setOpen(false);
    }
  };

  return (
    <div className="group relative inline-flex">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Report feedback for this section"
          >
            <IconFlagFill18 className="h-4 w-4" />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            align="start"
            className="z-50 w-72 rounded-lg border bg-background p-3 shadow-lg"
          >
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Section feedback
              </p>
              <label className="block space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Feedback type</span>
                <select
                  value={feedbackType}
                  onChange={(event) => setFeedbackType(event.target.value as BlockFeedbackType)}
                  className="focus-visible:ring-ring/50 border-input h-9 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-[3px]"
                >
                  {Object.entries(feedbackTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Details</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Describe what should be improved"
                  className="focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                />
              </label>
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={() => void submit()} disabled={isSubmitting}>
                  Submit
                </Button>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
