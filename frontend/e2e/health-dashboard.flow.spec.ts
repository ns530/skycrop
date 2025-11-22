import { test, expect, type Page } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_USER_EMAIL ?? 'farmer@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? 'password123';

async function login(page: Page) {
  await page.goto('/auth/login');

  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
}

async function navigateToFirstFieldHealth(page: Page): Promise<boolean> {
  await page.goto('/fields');

  const emptyMessage = page.getByText(/you haven't added any fields yet/i);
  if (await emptyMessage.count()) {
    return false;
  }

  const healthButtons = page.getByRole('button', { name: /health/i });
  const buttonCount = await healthButtons.count();
  if (buttonCount === 0) {
    return false;
  }

  await healthButtons.first().click();

  await expect(page).toHaveURL(/\/fields\/[^/]+\/health/);

  return true;
}

test.describe('Health - Field health dashboard flow', () => {
  test('opens health page for a field, shows status, and allows changing date range', async ({ page }) => {
    await login(page);

    const hasField = await navigateToFirstFieldHealth(page);
    if (!hasField) {
      test.skip(true, 'No fields available to test health dashboard flow');
      return;
    }

    await expect(
      page.getByRole('heading', { name: /field health/i }),
    ).toBeVisible();

    const noDataHeading = page.getByRole('heading', {
      name: /no health data available/i,
    });
    const noDataCount = await noDataHeading.count();

    if (!noDataCount) {
      const statusText = page.getByText(/excellent|good|fair|poor/i);
      await expect(statusText).toBeVisible();
    }

    const rangeButton = page.getByRole('button', { name: /14 days/i });
    await rangeButton.click();

    await expect(rangeButton).toHaveAttribute('aria-pressed', 'true');
  });
});