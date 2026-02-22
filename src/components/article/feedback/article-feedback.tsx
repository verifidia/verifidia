"use client";

import { useState } from "react";
import { IconThumbsDownFill18, IconThumbsUpFill18, IconMessagePlusFill18 } from "nucleo-ui-fill-18";
import { Button } from "@/components/ui/button";

type ArticleFeedbackProps = {
  articleId: string;
};

async function postFeedback(payload: {
  articleId: string;
  feedbackType: "thumbs_up" | "thumbs_down" | "article_feedback";
  content?: string;
}) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.ok;
}

export function ArticleFeedback({ articleId }: ArticleFeedbackProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const sendQuickFeedback = async (feedbackType: "thumbs_up" | "thumbs_down") => {
    setIsSubmitting(true);
    setMessage(null);

    const ok = await postFeedback({ articleId, feedbackType });

    setIsSubmitting(false);
    setMessage(ok ? "Thanks for the feedback." : "Could not submit feedback.");
  };

  const sendDetailedFeedback = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setMessage("Please add details before submitting.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const ok = await postFeedback({
      articleId,
      feedbackType: "article_feedback",
      content: trimmed,
    });

    setIsSubmitting(false);
    setMessage(ok ? "Detailed feedback submitted." : "Could not submit feedback.");

    if (ok) {
      setContent("");
      setIsExpanded(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card/70 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-2 text-sm text-muted-foreground">Was this article helpful?</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void sendQuickFeedback("thumbs_up")}
          disabled={isSubmitting}
        >
          <IconThumbsUpFill18 className="mr-1 h-4 w-4" />
          Yes
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void sendQuickFeedback("thumbs_down")}
          disabled={isSubmitting}
        >
          <IconThumbsDownFill18 className="mr-1 h-4 w-4" />
          No
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((current) => !current)}
          disabled={isSubmitting}
        >
          <IconMessagePlusFill18 className="mr-1 h-4 w-4" />
          Add details
        </Button>
      </div>

      {isExpanded ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Tell us what was missing, unclear, or inaccurate"
            className="focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring"
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => void sendDetailedFeedback()}>
              Submit details
            </Button>
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
    </section>
  );
}
