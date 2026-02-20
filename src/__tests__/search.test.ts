import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSearchResults = [
  {
    slug: "photosynthesis-en",
    title: "Photosynthesis",
    summary: "The process by which plants convert light.",
    locale: "en",
    generatedAt: new Date("2025-01-01"),
  },
  {
    slug: "photography-basics-en",
    title: "Photography Basics",
    summary: "An introduction to photography.",
    locale: "en",
    generatedAt: new Date("2025-01-02"),
  },
];

const mockAutocompleteResults = [
  { topic: "Photosynthesis", title: "Photosynthesis", slug: "photosynthesis-en" },
  { topic: "Photography", title: "Photography Basics", slug: "photography-basics-en" },
];

function createChainMock(resolvedValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(resolvedValue),
  };
  chain.limit.mockImplementation(() => {
    const promise = Promise.resolve(resolvedValue);
    return Object.assign(promise, {
      orderBy: vi.fn().mockResolvedValue(resolvedValue),
    });
  });
  return chain;
}

let mockDb: ReturnType<typeof createChainMock>;

vi.mock("@/db", () => ({
  get db() {
    return mockDb;
  },
}));

describe("search utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchArticles", () => {
    it("returns empty array for empty query", async () => {
      mockDb = createChainMock([]);
      const { searchArticles } = await import("@/lib/search");
      const results = await searchArticles("", "en");
      expect(results).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("returns empty array for whitespace-only query", async () => {
      mockDb = createChainMock([]);
      const { searchArticles } = await import("@/lib/search");
      const results = await searchArticles("   ", "en");
      expect(results).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("calls db with correct chain for valid query", async () => {
      mockDb = createChainMock(mockSearchResults);
      const { searchArticles } = await import("@/lib/search");
      const results = await searchArticles("photo", "en");
      expect(results).toEqual(mockSearchResults);
      expect(mockDb.select).toHaveBeenCalledTimes(1);
      expect(mockDb.from).toHaveBeenCalledTimes(1);
      expect(mockDb.where).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAutocompleteSuggestions", () => {
    it("returns empty array for empty query", async () => {
      mockDb = createChainMock([]);
      const { getAutocompleteSuggestions } = await import("@/lib/search");
      const results = await getAutocompleteSuggestions("", "en");
      expect(results).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("returns at most 5 results", async () => {
      mockDb = createChainMock(mockAutocompleteResults);
      const { getAutocompleteSuggestions } = await import("@/lib/search");
      const results = await getAutocompleteSuggestions("ph", "en");
      expect(results.length).toBeLessThanOrEqual(5);
      expect(mockDb.limit).toHaveBeenCalledWith(5);
    });
  });
});

describe("search route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/search", () => {
    it("returns { results: [] } for empty query", async () => {
      mockDb = createChainMock([]);
      const { GET } = await import("@/app/api/search/route");
      const request = new NextRequest("http://localhost/api/search?q=");
      const response = await GET(request);
      const body = await response.json();
      expect(body).toEqual({ results: [] });
    });

    it("returns search results for valid query", async () => {
      mockDb = createChainMock(mockSearchResults);
      const { GET } = await import("@/app/api/search/route");
      const request = new NextRequest(
        "http://localhost/api/search?q=photo&locale=en"
      );
      const response = await GET(request);
      const body = await response.json();
      expect(body.results).toEqual(
        JSON.parse(JSON.stringify(mockSearchResults))
      );
    });
  });

  describe("GET /api/search/autocomplete", () => {
    it("returns { suggestions: [] } for empty query", async () => {
      mockDb = createChainMock([]);
      const { GET } = await import("@/app/api/search/autocomplete/route");
      const request = new NextRequest(
        "http://localhost/api/search/autocomplete?q="
      );
      const response = await GET(request);
      const body = await response.json();
      expect(body).toEqual({ suggestions: [] });
    });

    it("returns suggestions for valid query", async () => {
      mockDb = createChainMock(mockAutocompleteResults);
      const { GET } = await import("@/app/api/search/autocomplete/route");
      const request = new NextRequest(
        "http://localhost/api/search/autocomplete?q=ph&locale=en"
      );
      const response = await GET(request);
      const body = await response.json();
      expect(body.suggestions).toEqual(
        JSON.parse(JSON.stringify(mockAutocompleteResults))
      );
    });
  });
});
