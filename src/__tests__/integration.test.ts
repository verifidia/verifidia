import { beforeEach, describe, expect, it, vi } from "vitest";

const getArticleMock = vi.fn();

vi.mock("@/lib/article-cache", () => ({
  getArticle: getArticleMock,
}));

describe("end-to-end routing integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns article route when cached article exists", async () => {
    getArticleMock.mockResolvedValueOnce({ slug: "quantum-physics" });
    const { getArticleRoute } = await import("@/lib/article-router");

    const route = await getArticleRoute("Quantum Physics", "en");

    expect(route).toBe("/article/quantum-physics");
  });

  it("returns generate route when article is not cached", async () => {
    getArticleMock.mockResolvedValueOnce(null);
    const { getArticleRoute } = await import("@/lib/article-router");

    const route = await getArticleRoute("Quantum Physics", "en");

    expect(route).toBe("/generate/quantum-physics");
  });

  it("converts topics into URL-safe slugs", async () => {
    const { topicToSlug } = await import("@/lib/article-router");

    expect(topicToSlug("Quantum Physics")).toBe("quantum-physics");
  });

  it("propagates locale through cache lookup", async () => {
    getArticleMock.mockResolvedValueOnce(null);
    const { getArticleRoute } = await import("@/lib/article-router");

    await getArticleRoute("Climate Change", "fr");

    expect(getArticleMock).toHaveBeenCalledWith("Climate Change", "fr");
  });
});
