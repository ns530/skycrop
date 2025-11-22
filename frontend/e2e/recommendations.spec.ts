import { test, expect } from '@playwright/test';

test.describe('Recommendations Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to recommendations
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByRole('link', { name: /recommendations/i }).click();
    await expect(page).toHaveURL(/\/recommendations/);
  });

  test('should display recommendations list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /recommendations/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should filter recommendations by priority', async ({ page }) => {
    await page.getByLabel(/priority/i).selectOption('critical');
    
    // Only critical recommendations should be visible
    await expect(page.getByRole('cell', { name: /critical/i })).toBeVisible();
  });

  test('should filter recommendations by type', async ({ page }) => {
    await page.getByLabel(/type/i).selectOption('irrigation');
    
    // Only irrigation recommendations should be visible
    await expect(page.getByRole('cell', { name: /irrigation/i })).toBeVisible();
  });

  test('should filter recommendations by status', async ({ page }) => {
    await page.getByLabel(/status/i).selectOption('pending');
    
    // Only pending recommendations should be visible
    await expect(page.getByRole('cell', { name: /pending/i })).toBeVisible();
  });

  test('should view recommendation details', async ({ page }) => {
    await page.getByRole('row').first().getByRole('link').click();
    
    await expect(page).toHaveURL(/\/recommendations\/[a-f0-9-]+/);
    await expect(page.getByRole('heading', { name: /recommendation details/i })).toBeVisible();
    await expect(page.getByText(/priority/i)).toBeVisible();
    await expect(page.getByText(/estimated cost/i)).toBeVisible();
  });

  test('should update recommendation status', async ({ page }) => {
    await page.getByRole('row').first().getByRole('button', { name: /update status/i }).click();
    
    // Select new status
    await page.getByRole('dialog').getByLabel(/status/i).selectOption('completed');
    await page.getByRole('dialog').getByRole('button', { name: /save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/status updated successfully/i)).toBeVisible();
  });

  test('should add notes to recommendation', async ({ page }) => {
    await page.getByRole('row').first().getByRole('link').click();
    
    await page.getByLabel(/notes/i).fill('Applied fertilizer as recommended');
    await page.getByRole('button', { name: /save notes/i }).click();
    
    await expect(page.getByText(/notes saved/i)).toBeVisible();
  });

  test('should export recommendations', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    
    await page.getByRole('button', { name: /export/i }).click();
    await page.getByRole('menuitem', { name: /excel/i }).click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('recommendations');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('should generate new recommendations for field', async ({ page }) => {
    await page.getByRole('button', { name: /generate/i }).click();
    
    // Select field
    await page.getByRole('dialog').getByLabel(/field/i).selectOption({ index: 1 });
    await page.getByRole('dialog').getByRole('button', { name: /generate/i }).click();
    
    // Should show loading and then success
    await expect(page.getByText(/generating/i)).toBeVisible();
    await expect(page.getByText(/recommendations generated/i)).toBeVisible({ timeout: 10000 });
  });

  test('should sort recommendations by date', async ({ page }) => {
    await page.getByRole('columnheader', { name: /date/i }).click();
    
    // Recommendations should be sorted
    // Verify first item date is >= second item date
  });

  test('should search recommendations', async ({ page }) => {
    await page.getByPlaceholder(/search recommendations/i).fill('irrigation');
    
    // Results should be filtered
    await expect(page.getByRole('row', { name: /irrigation/i })).toBeVisible();
  });
});

