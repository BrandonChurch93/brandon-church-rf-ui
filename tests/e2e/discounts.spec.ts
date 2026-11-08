import { test, expect, type Page } from '@playwright/test';
import { boot, toastText } from '../helpers';

const main = (page: Page) => page.locator('#paper-main');
const preview = (page: Page, name: string) => page.locator(`[data-preview="${name}"]`);

test.describe('discounts', () => {
  test('rows read as sentences with windows and usage', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'discounts' });
    await expect(main(page).getByText('25% off Full Conference and Workshop Day')).toBeVisible();
    await expect(main(page).getByText('15% off all packages')).toBeVisible();
    await expect(main(page).getByText('$100 off Full Conference')).toBeVisible();
    await expect(main(page).getByText('Sep 1 to Nov 1, 2026')).toBeVisible();
    await expect(main(page).getByRole('switch', { name: 'Early bird active' })).toBeDisabled();
  });

  test('percent preview math is exact', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'discounts' });
    await main(page).getByRole('button', { name: /^Early bird\./ }).click();
    await expect.poll(() => preview(page, 'Full Conference').textContent()).toBe('Full Conference · $899 → $674.25');
    await expect.poll(() => preview(page, 'Workshop Day').textContent()).toBe('Workshop Day · $399 → $299.25');
    await page.getByLabel('Amount').fill('100');
    await expect.poll(() => preview(page, 'Full Conference').textContent()).toBe('Full Conference · $899 → Free');
  });

  test('fixed amount validation against the lowest selected price, free packages unchanged', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'discounts' });
    await main(page).getByRole('button', { name: 'Add discount' }).click();
    const sheet = page.getByRole('dialog', { name: 'New discount' });
    await sheet.getByLabel('Name').fill('Flat 200');
    await sheet.getByRole('radio', { name: '$' }).click();
    await sheet.getByLabel('Amount').fill('200');
    await sheet.getByLabel('Amount').blur();
    await expect(sheet.getByText('Cannot exceed the lowest selected package price ($149)')).toBeVisible();
    await expect.poll(() => preview(page, 'Student').textContent()).toBe('Student · Free · no change');
    await sheet.getByRole('checkbox', { name: /^Expo Only/ }).uncheck();
    await expect(sheet.getByText(/Cannot exceed/)).toHaveCount(0);
    await sheet.getByLabel('Amount').fill('450');
    await expect(sheet.getByText('Cannot exceed the lowest selected package price ($399)')).toBeVisible();
    await sheet.getByLabel('Amount').fill('50');
    await expect.poll(() => preview(page, 'Full Conference').textContent()).toBe('Full Conference · $899 → $849');
    await sheet.getByRole('button', { name: 'Add discount' }).click();
    await expect(toastText(page, 'Added Flat 200')).toBeVisible();
  });

  test('window rules: end before start is invalid', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'discounts' });
    await main(page).getByRole('button', { name: /^Partner\./ }).click();
    const sheet = page.getByRole('dialog', { name: 'Edit discount' });
    await sheet.getByLabel('Starts').fill('Dec 1, 2026');
    await sheet.getByLabel('Ends').fill('Nov 1, 2026');
    await sheet.getByLabel('Ends').blur();
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(sheet.getByText('Must be on or after the start date')).toBeVisible();
  });

  test('remove warns about codes; codes lose the link and show a warning', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'discounts' });
    await main(page).locator('[data-flip-id]').filter({ hasText: 'Partner' }).hover();
    await main(page).getByRole('button', { name: 'Partner actions' }).click();
    await page.getByRole('menuitem', { name: 'Remove' }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Remove Partner?' });
    await expect(confirm).toContainText('1 code references this discount and will stop applying it.');
    await confirm.getByRole('button', { name: 'Remove' }).click();
    await expect(toastText(page, 'Removed Partner')).toBeVisible();
    await page.evaluate(() => (window.location.hash = 'reg-codes'));
    await expect(main(page).locator('tbody tr').filter({ hasText: 'RF-PARTNER-15' })).toContainText('Discount removed');
    await main(page).locator('tbody tr').filter({ hasText: 'RF-PARTNER-15' }).locator('td').nth(2).click();
    await expect(page.getByRole('dialog', { name: 'Edit code' }).getByText('Choose a discount').first()).toBeVisible();
  });

  test('empty state on Northwind', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'discounts' });
    await page.getByRole('button', { name: /switch event/i }).first().click();
    await page.getByRole('menuitemradio', { name: /Northwind/ }).click();
    await expect(main(page).getByText('No discounts yet')).toBeVisible();
  });
});
