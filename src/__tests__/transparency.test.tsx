import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TransparencyPanel } from "@/components/article/transparency-panel";
import { getModelDisplayName } from "@/lib/model-display";

describe("getModelDisplayName", () => {
  it("returns human-readable name for known model", () => {
    expect(getModelDisplayName("openai/gpt-5.2")).toBe(
      "GPT-5.2 (OpenAI)"
    );
  });

  it("returns model ID for unknown model", () => {
    expect(getModelDisplayName("unknown/model-xyz")).toBe("unknown/model-xyz");
  });
});

describe("TransparencyPanel", () => {
  const defaultProps = {
    modelUsed: "openai/gpt-5.2",
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
    expect(screen.queryByText("GPT-5.2 (OpenAI)")).not.toBeInTheDocument();
  });

  it("expands panel on click", () => {
    render(<TransparencyPanel {...defaultProps} />);

    fireEvent.click(screen.getByText("How was this made?").closest("button")!);

    expect(screen.getByText("GPT-5.2 (OpenAI)")).toBeInTheDocument();
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
