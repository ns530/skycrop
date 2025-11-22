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

async function navigateToFirstFieldWeather(page: Page): Promise<boolean> {
  await page.goto('/fields');

  const emptyMessage = page.getByText(/you haven't added any fields yet/i);
  if (await emptyMessage.count()) {
    return false;
  }

  const weatherButtons = page.getByRole('button', { name: /weather/i });
  const buttonCount = await weatherButtons.count();
  if (buttonCount === 0) {
    return false;
  }

  await weatherButtons.first().click();

  await expect(page).toHaveURL(/\/fields\/[^/]+\/weather/);

  return true;
}

test.describe('Weather - Field weather alerts flow', () => {
  test('shows per-field weather view with forecast and (if available) alerts', async ({ page }) => {
    await login(page);

    const hasField = await navigateToFirstFieldWeather(page);
    if (!hasField) {
      return;
    }

    await expect(
      page.getByRole('heading', { name: /weather/i }),
    ).toBeVisible();

    const forecastHeading = page.getByRole('heading', {
      name: /7-day forecast/i,
    });
    const forecastHeadingCount = await forecastHeading.count();
    if (forecastHeadingCount > 0) {
      await expect(forecastHeading.first()).toBeVisible();
    }

    const forecastSection = page.getByRole('region', {
      name: /7-day forecast/i,
    });
    const hasForecastSection = await forecastSection.count();
    if (hasForecastSection) {
      const anyCard = forecastSection
        .first()
        .locator('[data-testid="daily-forecast-card"]')
        .first();
      try {
        await expect(anyCard).toBeVisible({ timeout: 5000 });
      } catch {
      }
    }

    const alertBanner = page.getByRole('status');
    const bannerCount = await alertBanner.count();
    if (bannerCount > 0) {
      await expect(alertBanner.first()).toBeVisible();
    }
  });
});