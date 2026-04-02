import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and shows navigation', async ({ page }) => {
    await page.goto('/');
    // Main navigation — use CSS selector to avoid ARIA-tree variance across browsers
    await expect(page.locator('nav')).toBeVisible();
    // Brand heading
    await expect(
      page.getByRole('heading', { level: 1, name: /civitas/i })
    ).toBeVisible();
    // Chamber link (parliament)
    await expect(page.getByRole('link', { name: /chamber/i })).toBeVisible();
  });
});
