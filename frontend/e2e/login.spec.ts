import { test, expect } from "@playwright/test";

test.describe("Auth - Login route", () => {
  test("loads /auth/login and shows sign-in heading", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });
});
