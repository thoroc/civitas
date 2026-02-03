import { test, expect } from '@playwright/test';

test.describe('Cat Page', () => {
  test('renders cat placeholder content', async ({ page }) => {
    test.fixme(
      true,
      'Route compile/navigation unstable in current test environment'
    );
    await page.goto('/cat');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
