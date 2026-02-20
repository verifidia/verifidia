import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchResults } from "@/components/search/search-results";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("SearchResults", () => {
  it("renders results when provided", () => {
    const results = [
      {
        slug: "photosynthesis",
        title: "Photosynthesis",
        summary: "The process of...",
        locale: "en",
        generatedAt: new Date("2026-01-01"),
      },
    ];

    render(
      <SearchResults
        results={results}
        query="photo"
        locale="en"
        generateRoute="/generate/photo"
      />
    );

    expect(screen.getByText("Photosynthesis")).toBeInTheDocument();
  });

  it("shows no results message when empty", () => {
    render(
      <SearchResults
        results={[]}
        query="xyz"
        locale="en"
        generateRoute="/generate/xyz"
      />
    );

    expect(screen.getByText(/No articles found/)).toBeInTheDocument();
  });

  it("shows generate link when no results", () => {
    render(
        <SearchResults
          results={[]}
          query="quantum computing"
          locale="en"
          generateRoute="/generate/quantum-computing"
        />
      );

    expect(screen.getByText(/Generate article/)).toBeInTheDocument();
  });
});
