// Cross-browser smoke (WebKit and Chromium): faithful renders, the pill reaches Brandon's Mode, nav works.
import { test, expect } from '@playwright/test';
import { boot } from '../helpers';

test('smoke: faithful, pill, Brandon\'s Mode navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page);
  await expect(page.locator('[data-layer="faithful"]').getByRole('heading', { name: 'Event setup guide' })).toBeVisible();
  await page.locator('[data-pill]').click();
  await expect(page.locator('[data-transitioning]')).toHaveCount(0, { timeout: 6000 });
  await expect(page.locator('[data-layer="paper"]').getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('navigation', { name: 'Event navigation' }).getByRole('link', { name: 'Exhibitors' }).click();
  await expect(page.locator('#view-title')).toHaveText('Exhibitors');
  expect(errors).toEqual([]);
});
