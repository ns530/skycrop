import { test, expect } from "@playwright/test";

test.describe("Fields CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to fields
    await page.getByRole("link", { name: /fields/i }).click();
    await expect(page).toHaveURL(/\/fields/);
  });

  test("should display fields list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /fields/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("should search fields", async ({ page }) => {
    await page.getByPlaceholder(/search fields/i).fill("Test Field");

    // Results should be filtered
    await expect(page.getByRole("row", { name: /test field/i })).toBeVisible();
  });

  test("should filter fields by crop type", async ({ page }) => {
    await page.getByRole("button", { name: /filter/i }).click();
    await page.getByLabel(/crop type/i).selectOption("paddy");
    await page.getByRole("button", { name: /apply/i }).click();

    // Only paddy fields should be visible
    await expect(page.getByRole("cell", { name: /paddy/i })).toBeVisible();
  });

  test("should filter fields by status", async ({ page }) => {
    await page.getByRole("button", { name: /filter/i }).click();
    await page.getByLabel(/status/i).selectOption("active");
    await page.getByRole("button", { name: /apply/i }).click();

    // Only active fields should be visible
    await expect(page.getByRole("cell", { name: /active/i })).toBeVisible();
  });

  test("should navigate to create field page", async ({ page }) => {
    await page.getByRole("button", { name: /add field|create field/i }).click();

    await expect(page).toHaveURL(/\/fields\/new/);
    await expect(
      page.getByRole("heading", { name: /create field/i }),
    ).toBeVisible();
  });

  test("should create a new field", async ({ page }) => {
    await page.getByRole("button", { name: /add field/i }).click();

    // Fill form
    await page.getByLabel(/field name/i).fill(`Test Field ${Date.now()}`);
    await page.getByLabel(/crop type/i).selectOption("paddy");
    await page.getByLabel(/area/i).fill("2.5");
    await page.getByLabel(/soil type/i).selectOption("clay");

    // Draw boundary on map (simulate click on map)
    const map = page.getByRole("region", { name: /map/i });
    await map.click({ position: { x: 100, y: 100 } });
    await map.click({ position: { x: 200, y: 100 } });
    await map.click({ position: { x: 200, y: 200 } });
    await map.click({ position: { x: 100, y: 200 } });

    // Submit
    await page.getByRole("button", { name: /save|create/i }).click();

    // Should navigate back to fields list
    await expect(page).toHaveURL(/\/fields$/);
    await expect(page.getByText(/field created successfully/i)).toBeVisible();
  });

  test("should view field details", async ({ page }) => {
    await page.getByRole("row").first().getByRole("link").click();

    await expect(page).toHaveURL(/\/fields\/[a-f0-9-]+/);
    await expect(
      page.getByRole("heading", { name: /field details/i }),
    ).toBeVisible();
    await expect(page.getByText(/health score/i)).toBeVisible();
  });

  test("should edit field", async ({ page }) => {
    await page
      .getByRole("row")
      .first()
      .getByRole("button", { name: /edit/i })
      .click();

    await expect(page).toHaveURL(/\/fields\/[a-f0-9-]+\/edit/);

    // Update field name
    const nameInput = page.getByLabel(/field name/i);
    await nameInput.fill("Updated Field Name");

    await page.getByRole("button", { name: /save/i }).click();

    // Should show success message
    await expect(page.getByText(/field updated successfully/i)).toBeVisible();
  });

  test("should delete field", async ({ page }) => {
    await page
      .getByRole("row")
      .first()
      .getByRole("button", { name: /delete/i })
      .click();

    // Confirmation dialog
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /delete|confirm/i })
      .click();

    // Should show success message
    await expect(page.getByText(/field deleted successfully/i)).toBeVisible();
  });

  test("should sort fields by name", async ({ page }) => {
    await page.getByRole("columnheader", { name: /name/i }).click();

    // Fields should be sorted
    const firstRowName = await page
      .getByRole("row")
      .nth(1)
      .getByRole("cell")
      .first()
      .textContent();
    const secondRowName = await page
      .getByRole("row")
      .nth(2)
      .getByRole("cell")
      .first()
      .textContent();

    expect(
      firstRowName?.localeCompare(secondRowName || ""),
    ).toBeLessThanOrEqual(0);
  });

  test("should paginate fields", async ({ page }) => {
    const nextButton = page.getByRole("button", { name: /next/i });

    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // URL should update with page parameter
      await expect(page).toHaveURL(/page=2/);
    }
  });
});
