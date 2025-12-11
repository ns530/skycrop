import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display login page", async ({ page }) => {
    await expect(page).toHaveTitle(/SkyCrop/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();
  });

  test("should navigate to signup page", async ({ page }) => {
    await page.getByRole("link", { name: /sign up/i }).click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(
      page.getByRole("heading", { name: /create account/i }),
    ).toBeVisible();
  });

  test("should create new account", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel(/name/i).fill("Test User");
    await page.getByLabel(/email/i).fill(`test-${Date.now()}@example.com`);
    await page.getByLabel(/^password$/i).fill("password123");
    await page.getByLabel(/confirm password/i).fill("password123");
    await page.getByRole("button", { name: /sign up/i }).click();

    // Wait for verification or dashboard
    await expect(page).toHaveURL(/\/(dashboard|verify)/);
  });

  test("should toggle password visibility", async ({ page }) => {
    const passwordInput = page.getByLabel(/^password$/i);
    const toggleButton = page.getByRole("button", { name: /show password/i });

    await expect(passwordInput).toHaveAttribute("type", "password");

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("should remember me checkbox work", async ({ page }) => {
    const rememberCheckbox = page.getByLabel(/remember me/i);

    await expect(rememberCheckbox).not.toBeChecked();
    await rememberCheckbox.check();
    await expect(rememberCheckbox).toBeChecked();
  });

  test("should navigate to forgot password", async ({ page }) => {
    await page.getByRole("link", { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(
      page.getByRole("heading", { name: /reset password/i }),
    ).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByRole("button", { name: /profile|account/i }).click();
    await page.getByRole("menuitem", { name: /logout|sign out/i }).click();

    // Should return to login
    await expect(page).toHaveURL(/\/(login|signin)/);
  });
});
