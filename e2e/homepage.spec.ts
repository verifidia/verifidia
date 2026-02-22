import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("renders hero heading and tagline", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /the open verified encyclopedia/i })
    ).toBeVisible();
    await expect(
      page.getByText(/verified articles with full transparency/i)
    ).toBeVisible();
  });

  test("displays primary navigation links", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: /primary navigation/i });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
  });

  test("shows search bar with correct placeholder", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search any topic...");
    await expect(searchInput).toBeVisible();
  });

  test("renders how-it-works section with 3 steps", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /how it works/i })
    ).toBeVisible();
    await expect(page.getByText("Search", { exact: true })).toBeVisible();
    await expect(page.getByText("Verify", { exact: true })).toBeVisible();
    await expect(page.getByText("Read", { exact: true })).toBeVisible();
  });

  test("renders trending topics section with 5 topics", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /trending topics/i })
    ).toBeVisible();
    const topics = [
      "Quantum Computing",
      "CRISPR Gene Editing",
      "Climate Adaptation",
      "Ancient Mesopotamia",
      "Fusion Energy",
    ];
    for (const topic of topics) {
      await expect(page.getByText(topic)).toBeVisible();
    }
  });

  test("header contains Verifidia brand logo link", async ({ page }) => {
    const brandLink = page
      .getByRole("banner")
      .getByRole("link", { name: /verifidia/i });
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute("href", /\/en\/?$/);
  });



  test("search bar navigates to search page on Enter key", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search any topic...");
    await searchInput.fill("quantum computing");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/\/en\/search\?q=quantum/);
    await expect(
      page.getByRole("heading", { name: /search/i })
    ).toBeVisible();
  });
});
