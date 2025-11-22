import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_USER_EMAIL ?? 'farmer@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? 'password123';

test.describe('Auth - Login flow', () => {
  test('logs in and redirects to dashboard, then allows access to protected routes', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    await expect(
      page.getByRole('heading', { name: /farmer dashboard/i }),
    ).toBeVisible();

    await page.goto('/fields');

    await expect(
      page.getByRole('heading', { name: /your fields/i }),
    ).toBeVisible();
  });
});