import { test, expect } from "@playwright/test";

test.describe("Analytics Page", () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to analytics
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.getByRole("link", { name: /analytics/i }).click();
    await expect(page).toHaveURL(/\/analytics/);
  });

  test("should display analytics dashboard", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /analytics/i }),
    ).toBeVisible();
  });

  test("should display health trend chart", async ({ page }) => {
    const healthChart = page.getByRole("img", { name: /health trend/i });
    await expect(healthChart).toBeVisible();
  });

  test("should display yield forecast chart", async ({ page }) => {
    const yieldChart = page.getByRole("img", { name: /yield forecast/i });
    await expect(yieldChart).toBeVisible();
  });

  test("should display recommendation summary", async ({ page }) => {
    const recSummary = page.getByRole("region", {
      name: /recommendations summary/i,
    });
    await expect(recSummary).toBeVisible();
  });

  test("should filter analytics by field", async ({ page }) => {
    await page.getByLabel(/select field/i).selectOption({ index: 1 });

    // Charts should update
    await expect(page.getByText(/loading/i)).toBeVisible();
    await expect(page.getByText(/loading/i)).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("should filter analytics by date range", async ({ page }) => {
    await page.getByRole("button", { name: /date range/i }).click();
    await page.getByRole("option", { name: /last 30 days/i }).click();

    // Charts should update
    await expect(page.getByText(/last 30 days/i)).toBeVisible();
  });

  test("should export analytics data", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");

    await page.getByRole("button", { name: /export|download/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("analytics");
  });

  test("should display comparison view", async ({ page }) => {
    await page.getByRole("button", { name: /compare/i }).click();

    // Multiple field selection
    await page.getByLabel(/field 1/i).selectOption({ index: 1 });
    await page.getByLabel(/field 2/i).selectOption({ index: 2 });

    await page.getByRole("button", { name: /apply/i }).click();

    // Comparison chart should be visible
    await expect(page.getByRole("img", { name: /comparison/i })).toBeVisible();
  });

  test("should toggle chart types", async ({ page }) => {
    await page.getByRole("button", { name: /chart type/i }).click();
    await page.getByRole("option", { name: /bar chart/i }).click();

    // Chart should update
    await expect(page.getByRole("img", { name: /bar chart/i })).toBeVisible();
  });
});
