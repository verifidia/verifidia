import { test, expect } from "@playwright/test";

test.describe("Auth pages", () => {
  test("login page renders heading and email form", async ({ page }) => {
    await page.goto("/en/auth/login");
    await expect(page).toHaveURL(/\/en\/auth\/login/);
    await expect(
      page.getByRole("heading", { name: /sign in to verifidia/i })
    ).toBeVisible();
    await expect(page.getByText(/enter your email/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /create account|sign up/i })
    ).toBeVisible();
  });

  test("signup page renders heading with name and email fields", async ({
    page,
  }) => {
    await page.goto("/en/auth/signup");
    await expect(page).toHaveURL(/\/en\/auth\/signup/);
    await expect(
      page.getByRole("heading", { name: /create your account/i })
    ).toBeVisible();
    await expect(page.getByLabel(/your name|name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send verification code/i })
    ).toBeVisible();
  });

  test("verify page renders heading and shows missing-email fallback", async ({
    page,
  }) => {
    await page.goto("/en/auth/verify");
    await expect(page).toHaveURL(/\/en\/auth\/verify/);
    await expect(
      page.getByRole("heading", { name: /enter your code/i })
    ).toBeVisible();
    await expect(
      page.getByText(/missing email.*restart/i)
    ).toBeVisible();
  });

  test("login page links to signup page", async ({ page }) => {
    await page.goto("/en/auth/login");
    const signupLink = page.getByRole("link", {
      name: /create account|sign up/i,
    });
    await signupLink.click();
    await expect(page).toHaveURL(/\/en\/auth\/signup/);
  });

  test("signup page links to login page", async ({ page }) => {
    await page.goto("/en/auth/signup");
    const loginLink = page.getByRole("link", { name: /sign in/i });
    await loginLink.click();
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });
});
