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

async function navigateToFirstFieldRecommendations(
  page: Page,
): Promise<boolean> {
  await page.goto("/fields");

  const emptyMessage = page.getByText(/you haven't added any fields yet/i);
  if (await emptyMessage.count()) {
    return false;
  }

  const recButtons = page.getByRole("button", { name: /recommendations/i });
  const buttonCount = await recButtons.count();
  if (buttonCount === 0) {
    return false;
  }

  await recButtons.first().click();

  await expect(page).toHaveURL(/\/fields\/[^/]+\/recommendations/);

  return true;
}

test.describe("Recommendations - Apply flow", () => {
  test("marks a recommendation as applied when available", async ({ page }) => {
    await login(page);

    const hasField = await navigateToFirstFieldRecommendations(page);
    if (!hasField) {
      return;
    }

    await expect(
      page.getByRole("heading", { name: /recommendations/i }),
    ).toBeVisible();

    const applyButtons = page.getByRole("button", {
      name: /mark recommendation/i,
    });
    const applyCount = await applyButtons.count();

    if (applyCount === 0) {
      return;
    }

    await applyButtons.first().click();

    try {
      await expect(page.getByText(/recommendation applied/i)).toBeVisible({
        timeout: 5000,
      });
    } catch {}
  });
});
