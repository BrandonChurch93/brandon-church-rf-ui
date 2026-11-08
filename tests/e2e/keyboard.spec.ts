import { test, expect } from '@playwright/test';
import { boot } from '../helpers';

test.describe('keyboard', () => {
  test('skip link is the first stop and moves focus to main', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await page.locator('body').focus();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#paper-main')).toBeFocused();
  });

  test('palette traps focus and returns it to the trigger on Escape', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    const opener = page.getByRole('button', { name: /Search pages/ });
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(page.getByRole('combobox', { name: /Search pages/ })).toBeFocused();
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Command palette"]'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('sheets trap focus; Escape closes the topmost layer first', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await page.getByRole('button', { name: 'About this build' }).focus();
    await page.keyboard.press('Enter');
    const about = page.getByRole('dialog', { name: 'About this build' });
    await expect(about).toBeVisible();
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden();
    await expect(about).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(about).toBeHidden();
    await expect(page.getByRole('button', { name: 'About this build' })).toBeFocused();
  });

  test('? opens the shortcuts', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await page.locator('#paper-main').focus();
    await page.keyboard.press('Shift+?');
    await expect(page.getByRole('dialog', { name: 'About this build' }).getByRole('heading', { name: 'Shortcuts' })).toBeVisible();
  });

  test('menus move with arrows and close on Escape', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await page.getByRole('button', { name: /switch event/i }).first().focus();
    await page.keyboard.press('Enter');
    const items = page.getByRole('menuitemradio');
    await expect(items.first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(items.nth(2)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(items.first()).toBeHidden();
  });

  test('the mobile drawer traps focus and closes on Escape', async ({ page }) => {
    await boot(page, { mode: 'paper', width: 390, height: 844 });
    const menu = page.getByRole('button', { name: 'Open navigation' });
    await menu.click();
    const drawer = page.getByRole('dialog', { name: 'Navigation' });
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 20; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#paper-drawer'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(menu).toBeFocused();
  });
});
