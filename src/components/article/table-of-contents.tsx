"use client";

import { useEffect, useMemo, useState } from "react";
import { IconChevronDownFill18, IconListTreeFill18 } from "nucleo-ui-fill-18";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ArticleSection } from "@/types/article";

type TableOfContentsProps = {
  sections: ArticleSection[];
  title: string;
};

export function TableOfContents({ sections, title }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("section-0");

  const tocItems = useMemo(
    () =>
      sections.map((section, index) => ({
        id: `section-${index}`,
        label: section.heading,
      })),
    [sections]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.IntersectionObserver) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          .forEach((entry) => {
            setActiveSectionId(entry.target.id);
          });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.35, 0.6],
      }
    );

    tocItems.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const links = (
    <ul className="space-y-1 text-sm">
      {tocItems.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className={cn(
              "block rounded-md px-3 py-2 leading-snug transition-colors hover:bg-accent",
              activeSectionId === item.id
                ? "bg-trust-light font-medium text-trust"
                : "text-muted-foreground"
            )}
            onClick={() => setIsOpen(false)}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <aside className="lg:sticky lg:top-16 lg:self-start">
      <div className="rounded-xl border border-border/80 bg-card/70 p-3 backdrop-blur">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-semibold lg:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          <span className="inline-flex items-center gap-2">
            <IconListTreeFill18 className="size-4 text-trust" />
            {title}
          </span>
          <IconChevronDownFill18
            className={cn("size-4 transition-transform", isOpen && "rotate-180")}
          />
        </button>

        <div className={cn("pt-2 lg:hidden", !isOpen && "hidden")}>{links}</div>

        <div className="hidden lg:block">
          <p className="px-2 pb-2 text-sm font-semibold">{title}</p>
          <ScrollArea className="max-h-svh pr-2">{links}</ScrollArea>
        </div>
      </div>
    </aside>
  );
}
