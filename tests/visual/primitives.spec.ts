// Captures the dev-only primitives gallery in both themes (runs against the dev server).
import { test } from '@playwright/test';
import { capture } from './helpers';

for (const theme of ['light', 'dark'] as const) {
  test(`primitives gallery ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('http://localhost:5174/#dev-gallery');
    await page.waitForSelector('text=Primitives gallery');
    await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
    await page.evaluate(() => document.fonts.ready);
    await capture(page, `primitives/${theme}/gallery.png`);
  });
}
