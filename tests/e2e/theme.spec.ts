import { test, expect } from '@playwright/test';
import { boot } from '../helpers';

test.describe('theme', () => {
  test('light by default, dark applies data-theme, persists across reload', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await boot(page, { mode: 'paper' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.evaluate(() => window.__rf.setTheme('dark'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('[data-layer="paper"]')!).backgroundColor)).toBe('rgb(27, 26, 31)');
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(errors).toEqual([]);
  });

  test('system follows prefers-color-scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await boot(page, { mode: 'paper' });
    await page.evaluate(() => window.__rf.setTheme('system'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('the faithful page ignores the theme', async ({ page }) => {
    await boot(page, { theme: 'dark' });
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector('[data-layer="faithful"]')!).backgroundColor);
    expect(bg).toBe('rgb(255, 255, 255)');
  });
});
