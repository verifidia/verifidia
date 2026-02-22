import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import { ArticleView } from "@/components/article/article-view";
import { Citation } from "@/components/article/citation";
import { ConfidenceBanner } from "@/components/article/confidence-banner";
import { TableOfContents } from "@/components/article/table-of-contents";
import type { Article } from "@/types/article";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => {
    if (namespace !== "article") {
      return (key: string) => key;
    }

    return (key: string, values?: { date?: string }) => {
      const translations: Record<string, string> = {
        tableOfContents: "Table of Contents",
        references: "References",
        relatedTopics: "Related Topics",
      };

      if (key === "generatedAt") {
        return `Generated ${values?.date ?? ""}`;
      }

      return translations[key] ?? key;
    };
  },
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockArticle: Article = {
  id: "article-1",
  slug: "photosynthesis",
  topic: "Photosynthesis",
  locale: "en",
  title: "Photosynthesis",
  summary:
    "Photosynthesis is the process plants use to convert light energy into chemical energy.",
  sections: [
    {
      heading: "Overview",
      content: "Photosynthesis happens in chloroplasts and powers plant growth.",
      citations: [0],
    },
    {
      heading: "Light Reactions",
      content: "Light-dependent reactions produce ATP and NADPH.",
      citations: [1],
    },
  ],
  citations: [
    {
      text: "Campbell Biology, 12th Edition",
      url: "https://example.com/campbell",
      accessedDate: "2026-01-05",
    },
    {
      text: "Khan Academy - Photosynthesis",
      url: "https://example.com/khan",
      accessedDate: "2026-01-05",
    },
  ],
  relatedTopics: ["Cellular respiration", "Chlorophyll"],
  modelUsed: "openai/gpt-5.2",
  systemPromptUsed: "write an encyclopedia article",
  sourcesConsulted: [
    {
      title: "Encyclopedia source",
      url: "https://example.com/source",
    },
  ],
  confidenceScore: 0.9,
  generationTimeMs: 1400,
  generatedAt: new Date("2026-01-05T10:15:00Z"),
  status: "completed",
};


const mockRelatedTopicLinks = [
  { name: "Cellular respiration", href: "/generate/cellular-respiration" },
  { name: "Chlorophyll", href: "/generate/chlorophyll" },
];
describe("article components", () => {
  it("renders ArticleView with article content", () => {
    render(<ArticleView article={mockArticle} relatedTopicLinks={mockRelatedTopicLinks} />);

    expect(
      screen.getByRole("heading", { name: mockArticle.title })
    ).toBeInTheDocument();
    expect(screen.getByText(mockArticle.summary, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "References" })).toBeInTheDocument();
  });

  it("renders table of contents section headings", () => {
    render(<TableOfContents sections={mockArticle.sections} title="Table of Contents" />);

    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Light Reactions").length).toBeGreaterThan(0);
  });

  it("renders citation as [1] superscript link", () => {
    render(<Citation index={1} citation={mockArticle.citations[0]} />);

    expect(screen.getByRole("link", { name: "Reference 1" })).toHaveTextContent(
      "[1]"
    );
  });

  it("shows safe confidence state for score 0.9", () => {
    render(<ConfidenceBanner score={0.9} />);

    expect(screen.getByText(/high confidence article/i)).toBeInTheDocument();
    expect(screen.getByText(/safe/i)).toBeInTheDocument();
  });

  it("shows warning confidence state for score 0.75", () => {
    render(<ConfidenceBanner score={0.75} />);

    expect(
      screen.getByText(/moderate confidence - verify important claims/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/warning/i)).toBeInTheDocument();
  });
});
