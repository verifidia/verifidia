import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          const promise = Promise.resolve([]);
          return Object.assign(promise, {
            limit: vi.fn(async () => [{ relatedTopics: ["Cellular Respiration", "Chlorophyll"] }]),
          });
        }),
      })),
    })),
  },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual };
});

describe("checkCachedTopics", () => {
  it("returns empty map for empty topics array", async () => {
    const { checkCachedTopics } = await import("@/lib/related-topics");
    const result = await checkCachedTopics([], "en");
    expect(result.size).toBe(0);
  });
});

describe("Related Topics API", () => {
  it("returns topics array for valid slug", async () => {
    const { GET } = await import("@/app/api/articles/[slug]/related/route");
    const request = new NextRequest("http://localhost/api/articles/photosynthesis/related?locale=en");
    const response = await GET(
      request,
      { params: Promise.resolve({ slug: "photosynthesis" }) }
    );
    const body = await response.json() as { topics: Array<{ name: string; slug: string; cached: boolean }> };
    expect(Array.isArray(body.topics)).toBe(true);
    expect(body.topics).toHaveLength(2);
    expect(body.topics[0]).toEqual({
      name: "Cellular Respiration",
      slug: "cellular-respiration",
      cached: false,
    });
  });
});
