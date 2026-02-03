import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and shows navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/civitas/i);
    // Main navigation via aria-label
    const nav = page.getByRole('navigation', { name: /main navigation/i });
    await expect(nav).toBeVisible();
    // Brand heading
    await expect(
      page.getByRole('heading', { level: 1, name: /civitas/i })
    ).toBeVisible();
    // Chamber link (parliament)
    await expect(page.getByRole('link', { name: /chamber/i })).toBeVisible();
  });
});
