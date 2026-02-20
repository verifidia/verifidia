import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShareButtons } from "@/components/article/share-buttons";

describe("ShareButtons", () => {
  it("renders share buttons", () => {
    render(<ShareButtons title="Photosynthesis" url="https://verifidia.com/en/article/photosynthesis" />);
    expect(screen.getByText("X / Twitter")).toBeDefined();
    expect(screen.getByText("Facebook")).toBeDefined();
    expect(screen.getByText("LinkedIn")).toBeDefined();
    expect(screen.getByText("Copy link")).toBeDefined();
  });

  it("Twitter link contains encoded title and URL", () => {
    render(<ShareButtons title="Quantum Physics" url="https://verifidia.com/en/article/quantum-physics" />);
    const twitterLink = screen.getByLabelText("Share on X (Twitter)") as HTMLAnchorElement;
    expect(twitterLink.href).toContain("twitter.com/intent/tweet");
    expect(twitterLink.href).toContain("Quantum%20Physics");
  });

  it("has accessible aria labels", () => {
    render(<ShareButtons title="Test" url="https://example.com" />);
    expect(screen.getByLabelText("Share on X (Twitter)")).toBeDefined();
    expect(screen.getByLabelText("Share on Facebook")).toBeDefined();
    expect(screen.getByLabelText("Copy link")).toBeDefined();
  });
});
