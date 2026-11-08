import { test, expect, type Page } from '@playwright/test';
import { boot, toastText } from '../helpers';

const main = (page: Page) => page.locator('#paper-main');
const card = (page: Page, name: string) => main(page).locator('[data-flip-id]').filter({ has: page.getByRole('button', { name: new RegExp(`^${name},`) }) });

test.describe('packages', () => {
  test('sold counts and percentages match the seed', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'packages' });
    await expect(card(page, 'Full Conference')).toContainText('150 of 400 sold');
    await expect(card(page, 'Expo Only')).toContainText('40 of 600 sold');
    await expect(card(page, 'Workshop Day')).toContainText('30 of 40 sold');
    await expect(card(page, 'VIP Experience')).toContainText('9 of 10 sold');
    await expect(card(page, 'Student')).toContainText('Free');
    await expect(card(page, 'VIP Experience')).toContainText('+3 more');
  });

  test('add a package with includes tags', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'packages' });
    await main(page).getByRole('button', { name: 'Add package' }).first().click();
    const sheet = page.getByRole('dialog', { name: 'New package' });
    await sheet.getByLabel('Name').fill('Full Conference');
    await sheet.getByLabel('Price').fill('249');
    await sheet.getByRole('button', { name: 'Add package' }).click();
    await expect(sheet.getByText('Another package already has this name')).toBeVisible();
    await sheet.getByLabel('Name').fill('Day Pass');
    const tags = sheet.getByRole('combobox', { name: 'Includes' });
    await tags.fill('Keynotes');
    await tags.press('Enter');
    await tags.fill('Lunch');
    await tags.press('Enter');
    await tags.press('Backspace');
    await expect(sheet.getByRole('button', { name: 'Remove Keynotes' })).toBeVisible();
    await sheet.getByRole('radio', { name: 'Active' }).click();
    await sheet.getByRole('button', { name: 'Add package' }).click();
    await expect(toastText(page, 'Added Day Pass')).toBeVisible();
    await expect(card(page, 'Day Pass')).toContainText('$249');
  });

  test('archive and unarchive with the filter', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'packages' });
    await card(page, 'Expo Only').hover();
    await card(page, 'Expo Only').getByRole('button', { name: 'More actions for Expo Only' }).click();
    await page.getByRole('menuitem', { name: 'Archive' }).click();
    await expect(card(page, 'Expo Only')).toHaveCount(0);
    await main(page).getByRole('radio', { name: 'Archived' }).click();
    await expect(card(page, 'Expo Only')).toBeVisible();
    await expect(card(page, 'Press Pass')).toBeVisible();
    await card(page, 'Expo Only').hover();
    await card(page, 'Expo Only').getByRole('button', { name: 'More actions for Expo Only' }).click();
    await page.getByRole('menuitem', { name: 'Unarchive' }).click();
    await main(page).getByRole('radio', { name: 'Active' }).click();
    await expect(card(page, 'Expo Only')).toBeVisible();
  });

  test('remove is blocked when sold; allowed and undoable when not', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'packages' });
    await card(page, 'Full Conference').hover();
    await card(page, 'Full Conference').getByRole('button', { name: /More actions/ }).click();
    await expect(page.getByRole('menuitem', { name: 'Remove' })).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    await card(page, 'Student').hover();
    await card(page, 'Student').getByRole('button', { name: /More actions/ }).click();
    await page.getByRole('menuitem', { name: 'Remove' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click();
    await expect(card(page, 'Student')).toHaveCount(0);
    await toastText(page, 'Removed Student').locator('..').getByRole('button', { name: /Undo/ }).click();
    await expect(card(page, 'Student')).toBeVisible();
  });

  test('capacity cannot drop below what is sold', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'packages' });
    await page.getByRole('button', { name: /^Workshop Day,/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Edit package' });
    await sheet.getByLabel('Capacity').fill('20');
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(sheet.getByText('Already 30 sold, so capacity must be at least 30')).toBeVisible();
  });

  test('changing the event currency reformats prices', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'packages' });
    await page.keyboard.press('ControlOrMeta+k');
    await page.getByRole('combobox', { name: /Search pages/ }).fill('edit event');
    await page.keyboard.press('Enter');
    const sheet = page.getByRole('dialog', { name: 'Edit event' });
    await sheet.getByRole('combobox', { name: 'Currency' }).click();
    await page.getByRole('option', { name: /EUR/ }).click();
    await sheet.getByRole('button', { name: 'Save changes' }).click();
    await expect(card(page, 'Full Conference')).toContainText('€899');
  });
});
