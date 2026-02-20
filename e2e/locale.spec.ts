import { test, expect } from "@playwright/test";

test.describe("Locale switching", () => {
  test("root / redirects to /en", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en\b/);
  });

  test("/es locale loads Spanish homepage", async ({ page }) => {
    await page.goto("/es");
    await expect(page).toHaveURL(/\/es\b/);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(
      page.getByRole("heading", { name: /the open ai encyclopedia/i })
    ).toBeVisible();
  });

  test("/ar locale sets RTL direction", async ({ page }) => {
    await page.goto("/ar");
    await expect(page).toHaveURL(/\/ar\b/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("footer reflects current locale code", async ({ page }) => {
    await page.goto("/fr");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByText("Locale: FR")).toBeVisible();
  });

  test("search page is accessible under different locales", async ({
    page,
  }) => {
    await page.goto("/de/search");
    await expect(page).toHaveURL(/\/de\/search/);
    await expect(
      page.getByRole("heading", { name: /search/i })
    ).toBeVisible();
  });
});
