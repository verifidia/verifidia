import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TransparencyPanel } from "@/components/article/transparency-panel";
import { getModelDisplayName } from "@/lib/model-display";

describe("getModelDisplayName", () => {
  it("returns human-readable name for known model", () => {
    expect(getModelDisplayName("anthropic/claude-3-5-haiku-20241022")).toBe(
      "Claude 3.5 Haiku (Anthropic)"
    );
  });

  it("returns model ID for unknown model", () => {
    expect(getModelDisplayName("unknown/model-xyz")).toBe("unknown/model-xyz");
  });
});

describe("TransparencyPanel", () => {
  const defaultProps = {
    modelUsed: "anthropic/claude-3-5-haiku-20241022",
    systemPromptUsed: "You are an encyclopedic writer...",
    sourcesConsulted: [{ title: "Wikipedia", url: "https://wikipedia.org" }],
    confidenceScore: 0.85,
    generationTimeMs: 45000,
    generatedAt: new Date("2026-02-21"),
    locale: "en",
  };

  it("renders collapsed by default", () => {
    render(<TransparencyPanel {...defaultProps} />);

    expect(screen.getByText("How was this made?")).toBeInTheDocument();
    expect(screen.queryByText("Claude 3.5 Haiku (Anthropic)")).not.toBeInTheDocument();
  });

  it("expands panel on click", () => {
    render(<TransparencyPanel {...defaultProps} />);

    fireEvent.click(screen.getByText("How was this made?").closest("button")!);

    expect(screen.getByText("Claude 3.5 Haiku (Anthropic)")).toBeInTheDocument();
  });

  it("shows confidence score as percentage", () => {
    render(<TransparencyPanel {...defaultProps} />);

    fireEvent.click(screen.getByText("How was this made?").closest("button")!);

    expect(screen.getByText(/Confidence Score - 85%/i)).toBeInTheDocument();
  });

  it("shows source links when sources exist", () => {
    render(<TransparencyPanel {...defaultProps} />);

    fireEvent.click(screen.getByText("How was this made?").closest("button")!);

    const sourceLink = screen.getByRole("link", { name: "Wikipedia" });
    expect(sourceLink).toHaveAttribute("href", "https://wikipedia.org");
  });

  it("toggles system prompt visibility", () => {
    render(<TransparencyPanel {...defaultProps} />);

    fireEvent.click(screen.getByText("How was this made?").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /show system prompt/i }));
    expect(screen.getByText("You are an encyclopedic writer...")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide system prompt/i }));
    expect(
      screen.queryByText("You are an encyclopedic writer...")
    ).not.toBeInTheDocument();
  });
});
