"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconCopyFill18, IconCheckFill18, IconShareRightFill18 } from "nucleo-ui-fill-18";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      void _;
    }
  };

  return (
    <fieldset className="flex items-center gap-2 flex-wrap border-0 p-0 m-0" aria-label="Share article">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <IconShareRightFill18 className="h-4 w-4" />
        Share:
      </span>
      
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
        aria-label="Share on X (Twitter)"
      >
        X / Twitter
      </a>
      
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
        aria-label="Share on Facebook"
      >
        Facebook
      </a>
      
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
        aria-label="Share on LinkedIn"
      >
        LinkedIn
      </a>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="text-xs h-7"
        aria-label="Copy link"
      >
        {copied ? (
          <><IconCheckFill18 className="h-3 w-3 mr-1" /> Copied!</>
        ) : (
          <><IconCopyFill18 className="h-3 w-3 mr-1" /> Copy link</>
        )}
      </Button>
    </fieldset>
  );
}
