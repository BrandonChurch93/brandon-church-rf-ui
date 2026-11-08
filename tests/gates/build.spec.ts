// Build gate (docs/19-testing.md): the single-file build opens over file:// with no server.
import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const FILE = pathToFileURL(resolve(process.env.BUILD_HTML ?? 'build/index.html')).href;

test.describe('build over file://', () => {
  test('renders faithful mode with fonts and a clean console', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('requestfailed', (r) => problems.push(`failed request: ${r.url()}`));
    await page.goto(FILE);
    await expect(page).toHaveTitle('RainFocus Summit · Claude');
    const layer = page.locator('[data-layer="faithful"]');
    await expect(layer.getByRole('heading', { name: 'Event setup guide' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('600 14px Inter'))).toBe(true);
    expect(problems).toEqual([]);
  });

  test('the pill toggles into Brandon\'s Mode and back', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    await page.goto(FILE);
    const pill = page.locator('[data-pill]');
    await expect(pill).toBeVisible({ timeout: 5000 });
    await pill.click();
    await expect(page.locator('[data-layer="paper"]')).toBeVisible();
    await expect(page.locator('[data-transitioning]')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('[data-layer="faithful"]')).toHaveCount(0);
    await expect(page.locator('[data-layer="paper"]').getByRole('heading', { level: 1, name: 'Event setup guide' })).toBeVisible();
    await page.evaluate(() => window.__rf.setTheme('dark'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await pill.click();
    await expect(page.locator('[data-transitioning]')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('[data-layer="faithful"]')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('Brandon\'s Mode data persists across a reload over file://', async ({ page }) => {
    await page.goto(FILE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.evaluate(() => window.__rf.setMode('paper', { instant: true }));
    await page.getByRole('button', { name: /Event name: RainFocus Summit/ }).click();
    await page.getByRole('textbox', { name: 'Event name' }).fill('Summit over file');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.locator('[data-layer="faithful"]')).toBeVisible();
    await page.evaluate(() => window.__rf.setMode('paper', { instant: true }));
    await expect(page.getByRole('button', { name: /Event name: Summit over file/ })).toBeVisible();
    await page.evaluate(() => localStorage.clear());
  });

  test('no horizontal scroll at 320', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(FILE);
    const overflow = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[data-layer="faithful"]')!;
      return el.scrollWidth > el.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });
});
