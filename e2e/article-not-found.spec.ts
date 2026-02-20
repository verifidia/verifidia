import { test, expect } from "@playwright/test";

test.describe("Article not-found fallback", () => {
  test("shows not-found message for nonexistent article slug", async ({
    page,
  }) => {
    await page.goto("/en/article/this-slug-does-not-exist-abc123");
    await expect(
      page.getByRole("heading", { name: /article not found/i })
    ).toBeVisible();
    await expect(
      page.getByText(/no article found for this topic/i)
    ).toBeVisible();
  });

  test("not-found page has a search link back to homepage", async ({
    page,
  }) => {
    await page.goto("/en/article/nonexistent-test-slug");
    const searchLink = page.getByRole("link", { name: /search for it/i });
    await expect(searchLink).toBeVisible();
    await searchLink.click();
    await expect(page).toHaveURL(/\/en\/?$/);
  });
});
