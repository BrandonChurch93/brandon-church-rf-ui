import { test, expect } from '@playwright/test';
import { boot, collectErrors, hasHorizontalOverflow } from '../helpers';

test.describe('faithful mode', () => {
  test('renders the design at 1447 with the right title and a clean console', async ({ page }) => {
    const errors = collectErrors(page);
    await boot(page);
    await expect(page).toHaveTitle('RainFocus Summit · Claude');
    const layer = page.locator('[data-layer="faithful"]');
    await expect(layer.getByRole('heading', { level: 1, name: 'RainFocus Summit' })).toBeVisible();
    await expect(layer.getByRole('heading', { name: 'Event setup guide' })).toBeVisible();
    await expect(layer.getByText('Step 1:')).toBeVisible();
    await expect(layer.getByText('Attendee Registration')).toHaveCount(3);
    await expect(layer.getByText('Add Registration Workflow')).toBeVisible();
    await expect(layer.getByText('Manage the portal that attendees will see after they’ve register for your event.')).toBeVisible();
    await expect(layer.getByRole('button', { name: 'Open navigation' })).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('links and buttons do nothing', async ({ page }) => {
    await boot(page);
    const layer = page.locator('[data-layer="faithful"]');
    await layer.getByRole('link', { name: 'Packages' }).click();
    await layer.getByRole('button', { name: 'Edit event' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(layer.getByRole('heading', { name: 'Event setup guide' })).toBeVisible();
  });

  test('mobile drawer opens and closes with the mouse', async ({ page }) => {
    await boot(page, { width: 390, height: 844 });
    const layer = page.locator('[data-layer="faithful"]');
    const menu = layer.getByRole('button', { name: 'Open navigation' });
    const nav = layer.getByRole('navigation', { name: 'Event navigation' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).not.toBeInViewport();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeInViewport();
    // Click the scrim, to the right of the drawer.
    await page.mouse.click(370, 400);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).not.toBeInViewport();
  });

  test('mobile drawer works from the keyboard and returns focus', async ({ page }) => {
    await boot(page, { width: 390, height: 844 });
    const layer = page.locator('[data-layer="faithful"]');
    const menu = layer.getByRole('button', { name: 'Open navigation' });
    // The closed drawer is inert: its links are not reachable.
    await expect(page.locator('#faithful-drawer')).toHaveAttribute('inert', '');
    await menu.focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('#faithful-drawer') ?? null)).toBeNull();
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(layer.getByRole('link', { name: 'RainFocus' })).toBeFocused();
    // Focus is trapped inside the drawer.
    await page.keyboard.press('Shift+Tab');
    await expect(layer.getByRole('link', { name: 'Exhibitors' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(layer.getByRole('link', { name: 'RainFocus' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
  });

  for (const width of [320, 375, 390, 414, 600, 768, 900, 1024, 1200, 1447, 1920]) {
    test(`no horizontal scroll at ${width}`, async ({ page }) => {
      await boot(page, { width, height: 900 });
      expect(await hasHorizontalOverflow(page, 'faithful')).toBe(false);
    });
  }
});
