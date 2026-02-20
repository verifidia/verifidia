import { test, expect } from "@playwright/test";

test.describe("Search page", () => {
  test("loads with heading and search input", async ({ page }) => {
    await page.goto("/en/search");
    await expect(page).toHaveURL(/\/en\/search/);
    await expect(
      page.getByRole("heading", { name: /search/i })
    ).toBeVisible();
    await expect(page.getByLabel("Search topics")).toBeVisible();
  });

  test("shows empty state when no query provided", async ({ page }) => {
    await page.goto("/en/search");
    await expect(
      page.getByText(/type a topic to search for articles/i)
    ).toBeVisible();
  });

  test("accepts query parameter and shows results message", async ({
    page,
  }) => {
    await page.goto("/en/search?q=quantum");
    await expect(page).toHaveURL(/\/en\/search\?q=quantum/);
    await expect(page.getByText(/result.*for.*"quantum"/i)).toBeVisible();
  });

  test("search input accepts keyboard input", async ({ page }) => {
    await page.goto("/en/search");
    const input = page.getByLabel("Search topics");
    await input.fill("climate change");
    await expect(input).toHaveValue("climate change");
  });
});
