import { test, expect } from "@playwright/test";

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display dashboard with key metrics", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();

    // Check for stat cards
    await expect(page.getByText(/total fields/i)).toBeVisible();
    await expect(page.getByText(/active fields/i)).toBeVisible();
    await expect(page.getByText(/critical alerts/i)).toBeVisible();
    await expect(page.getByText(/pending recommendations/i)).toBeVisible();
  });

  test("should navigate to fields page", async ({ page }) => {
    await page.getByRole("link", { name: /fields/i }).click();

    await expect(page).toHaveURL(/\/fields/);
    await expect(page.getByRole("heading", { name: /fields/i })).toBeVisible();
  });

  test("should navigate to analytics page", async ({ page }) => {
    await page.getByRole("link", { name: /analytics/i }).click();

    await expect(page).toHaveURL(/\/analytics/);
    await expect(
      page.getByRole("heading", { name: /analytics/i }),
    ).toBeVisible();
  });

  test("should navigate to recommendations page", async ({ page }) => {
    await page.getByRole("link", { name: /recommendations/i }).click();

    await expect(page).toHaveURL(/\/recommendations/);
    await expect(
      page.getByRole("heading", { name: /recommendations/i }),
    ).toBeVisible();
  });

  test("should display recent activities", async ({ page }) => {
    const activitySection = page.getByRole("region", {
      name: /recent activities/i,
    });
    await expect(activitySection).toBeVisible();

    // Check for at least one activity item
    await expect(activitySection.getByRole("listitem").first()).toBeVisible();
  });

  test("should display health overview chart", async ({ page }) => {
    const chartSection = page.getByRole("region", { name: /health overview/i });
    await expect(chartSection).toBeVisible();
  });

  test("should refresh dashboard data", async ({ page }) => {
    await page.getByRole("button", { name: /refresh/i }).click();

    // Wait for loading indicator
    await expect(page.getByText(/loading/i)).toBeVisible();
    await expect(page.getByText(/loading/i)).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should display notification bell", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /notifications/i }),
    ).toBeVisible();
  });

  test("should open notification dropdown", async ({ page }) => {
    await page.getByRole("button", { name: /notifications/i }).click();

    await expect(
      page.getByRole("dialog", { name: /notifications/i }),
    ).toBeVisible();
  });

  test("should filter dashboard by date range", async ({ page }) => {
    await page.getByRole("button", { name: /date range/i }).click();
    await page.getByRole("option", { name: /last 7 days/i }).click();

    // Dashboard should update
    await expect(page.getByText(/last 7 days/i)).toBeVisible();
  });
});
