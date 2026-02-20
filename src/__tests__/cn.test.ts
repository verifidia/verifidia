import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";

describe("cn() utility", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("deduplicates conflicting Tailwind classes (tailwind-merge)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes (clsx)", () => {
    expect(cn("base", false && "not-included", "included")).toBe("base included");
  });

  it("handles undefined gracefully", () => {
    expect(cn("a", undefined, "b")).toBe("a b");
  });

  it("handles arrays", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});
