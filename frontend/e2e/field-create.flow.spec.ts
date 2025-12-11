import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_USER_EMAIL ?? "farmer@example.com";
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "password123";

async function login(page: Page) {
  await page.goto("/auth/login");

  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Fields - Creation flow", () => {
  test("creates a new field and shows it in detail and (if present) list", async ({
    page,
  }) => {
    await login(page);

    await page.goto("/fields/create");

    await expect(
      page.getByRole("heading", { name: /add new field/i }),
    ).toBeVisible();

    const fieldName = `E2E Field ${Date.now()}`;

    await page.getByLabel(/field name/i).fill(fieldName);

    const notesLocator = page.getByLabel(/notes \(optional\)/i);
    if (await notesLocator.count()) {
      await notesLocator.fill("Created via E2E test flow");
    }

    await page.getByRole("button", { name: /save field/i }).click();

    await expect(page).toHaveURL(/\/fields\/.+/);

    await expect(page.getByRole("heading", { name: fieldName })).toBeVisible();

    await page.goto("/fields");

    const row = page.getByRole("row", { name: new RegExp(fieldName, "i") });
    const rowCount = await row.count();

    if (rowCount > 0) {
      await expect(row.first()).toBeVisible();
    }
  });
});
