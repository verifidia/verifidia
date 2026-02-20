import { describe, it, expect, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => []),
        })),
      })),
    })),
    execute: vi.fn(async () => [{ acquired: true }]),
  },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, sql: actual.sql };
});

describe("Article Cache", () => {
  it("getArticle returns null when no article found", async () => {
    const { getArticle } = await import("@/lib/article-cache");
    const result = await getArticle("nonexistent", "en");

    expect(result).toBeNull();
  });

  it("isGenerating returns false when no generating article", async () => {
    const { isGenerating } = await import("@/lib/article-cache");
    const result = await isGenerating("topic", "en");

    expect(result).toBe(false);
  });

  it("acquireGenerationLock returns true when lock acquired", async () => {
    const { acquireGenerationLock } = await import("@/lib/generation-lock");
    const result = await acquireGenerationLock("topic", "en");

    expect(result).toBe(true);
  });

  it("releaseGenerationLock calls pg_advisory_unlock", async () => {
    const { db } = await import("@/db");
    const { releaseGenerationLock } = await import("@/lib/generation-lock");

    await releaseGenerationLock("topic", "en");

    expect(db.execute).toHaveBeenCalled();
  });
});
