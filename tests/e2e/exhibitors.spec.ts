import { test, expect, type Page } from '@playwright/test';
import { boot, hasHorizontalOverflow, toastText } from '../helpers';

const main = (page: Page) => page.locator('#paper-main');
const card = (page: Page, name: string) => main(page).locator('[data-flip-id]').filter({ has: page.getByRole('button', { name: new RegExp(`^${name},`) }) });
const booth = (page: Page, label: string) => main(page).getByRole('group', { name: 'Floor map' }).getByRole('button', { name: new RegExp(`^Booth ${label},`) });
const toMap = (page: Page) => main(page).getByRole('radio', { name: 'Floor map' }).click();

test.describe('exhibitors', () => {
  test('cards are sorted by tier, then name, and the toolbar filters them', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await expect(main(page).getByText('18 exhibitors')).toBeVisible();
    const names = main(page).locator('[data-flip-id] button[aria-label$="Open details"]');
    await expect(names.first()).toHaveText('Checkpoint Kiosks');
    await expect(names.nth(3)).toHaveText('Badgecraft');
    await expect(card(page, 'Lumen AV')).toContainText('Booth D2');

    await main(page).getByRole('button', { name: 'Tier filter' }).click();
    await page.getByRole('checkbox', { name: 'Gold' }).check();
    await page.keyboard.press('Escape');
    await expect(main(page).getByText('7 of 18 exhibitors')).toBeVisible();

    await main(page).getByRole('button', { name: 'Clear filters' }).click();
    await main(page).getByRole('button', { name: 'Booth filter' }).click();
    await page.getByRole('checkbox', { name: 'Unassigned' }).check();
    await page.keyboard.press('Escape');
    await expect(main(page).getByText('2 of 18 exhibitors')).toBeVisible();
    await expect(card(page, 'Coverall Insurance')).toContainText('No booth');

    await main(page).getByRole('button', { name: 'Clear filters' }).click();
    await main(page).getByRole('searchbox', { name: 'Search exhibitors' }).fill('liam gall');
    await expect(main(page).getByText('1 of 18 exhibitors')).toBeVisible();
    await expect(card(page, 'Lumen AV')).toBeVisible();

    await main(page).getByRole('searchbox', { name: 'Search exhibitors' }).fill('zzzz');
    await expect(main(page).getByText('No exhibitors match')).toBeVisible();
    await main(page).getByRole('button', { name: 'Clear filters' }).last().click();
    await expect(main(page).getByText('18 exhibitors')).toBeVisible();
  });

  test('floor map: names, hover tooltip, open an occupied booth', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await toMap(page);
    await expect(main(page).getByRole('group', { name: 'Floor map' }).getByRole('button')).toHaveCount(24);
    await expect(booth(page, 'D3')).toHaveAccessibleName('Booth D3, Checkpoint Kiosks, Platinum, confirmed');
    await expect(booth(page, 'C6')).toHaveAccessibleName('Booth C6, empty, assign exhibitor');
    await expect(main(page).getByText('16 of 24 booths assigned')).toBeVisible();

    await booth(page, 'D2').hover();
    await expect(page.getByRole('tooltip')).toContainText('Lumen AV');
    await expect(page.getByRole('tooltip')).toContainText('Liam Gallagher');

    await booth(page, 'D2').click();
    await expect(page.getByRole('dialog', { name: 'Lumen AV' })).toBeVisible();
  });

  test('assign an empty booth from the map, then undo', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await toMap(page);
    await booth(page, 'C6').click();
    const pop = page.getByRole('dialog', { name: 'Assign booth C6' });
    await expect(pop).toBeVisible();
    await pop.getByRole('combobox', { name: 'Exhibitors without a booth' }).fill('cover');
    await pop.getByRole('option', { name: /Coverall Insurance/ }).click();
    await expect(toastText(page, 'Assigned Coverall Insurance to C6')).toBeVisible();
    await expect(booth(page, 'C6')).toHaveAccessibleName('Booth C6, Coverall Insurance, Silver, pending');
    await expect(main(page).getByText('17 of 24 booths assigned')).toBeVisible();
    await page.getByRole('button', { name: 'Undo assigning Coverall Insurance to C6' }).click();
    await expect(booth(page, 'C6')).toHaveAccessibleName('Booth C6, empty, assign exhibitor');
  });

  test('keyboard: booths in reading order, Enter opens and assigns', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await toMap(page);
    await booth(page, 'A1').focus();
    await page.keyboard.press('Tab');
    await expect(booth(page, 'A2')).toBeFocused();
    await page.keyboard.press('Enter');
    const sheet = page.getByRole('dialog', { name: 'Swagsmith' });
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(booth(page, 'A2')).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(booth(page, 'A1')).toBeFocused();
    await page.keyboard.press('Enter');
    const pop = page.getByRole('dialog', { name: 'Assign booth A1' });
    await expect(pop.getByRole('combobox')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(toastText(page, /Assigned Signpost Displays to A1/)).toBeVisible();
    await expect(booth(page, 'A1')).toBeFocused();
  });

  test('card Assign link and kebab actions', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await card(page, 'Coverall Insurance').getByRole('button', { name: 'Assign a booth to Coverall Insurance' }).click();
    const pop = page.getByRole('dialog', { name: 'Assign a booth to Coverall Insurance' });
    await pop.getByRole('option', { name: /^B2/ }).click();
    await expect(toastText(page, 'Assigned Coverall Insurance to B2')).toBeVisible();
    await expect(card(page, 'Coverall Insurance')).toContainText('Booth B2');

    await card(page, 'Lumen AV').hover();
    await card(page, 'Lumen AV').getByRole('button', { name: 'Copy Lumen AV contact email' }).click();
    await expect(toastText(page, 'Copied liam.gallagher@lumenav.example')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('liam.gallagher@lumenav.example');

    await card(page, 'Lumen AV').getByRole('button', { name: 'More actions for Lumen AV' }).click();
    await page.getByRole('menuitem', { name: 'Mark pending' }).click();
    await expect(toastText(page, 'Marked Lumen AV pending')).toBeVisible();
    await expect(card(page, 'Lumen AV').getByRole('img', { name: 'Status: Pending' })).toBeAttached();

    await card(page, 'Lumen AV').hover();
    await card(page, 'Lumen AV').getByRole('button', { name: 'More actions for Lumen AV' }).click();
    await page.getByRole('menuitem', { name: 'Change booth' }).click();
    const move = page.getByRole('dialog', { name: 'Move Lumen AV' });
    await move.getByRole('option', { name: /^A6/ }).click();
    await expect(toastText(page, 'Moved Lumen AV to A6')).toBeVisible();
    await expect(card(page, 'Lumen AV')).toContainText('Booth A6');
  });

  test('add an exhibitor with validation and a booth', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await main(page).getByRole('button', { name: 'Add exhibitor' }).first().click();
    const sheet = page.getByRole('dialog', { name: 'New exhibitor' });
    await sheet.getByRole('textbox', { name: /^Company name/ }).fill('Lumen AV');
    await sheet.getByRole('textbox', { name: /^Contact email/ }).fill('nope');
    await sheet.getByRole('button', { name: 'Add exhibitor' }).click();
    await expect(sheet.getByText('An exhibitor with this name already exists')).toBeVisible();
    await expect(sheet.getByText('Enter a valid email address, like jane@example.com')).toBeVisible();

    await sheet.getByRole('textbox', { name: /^Company name/ }).fill('Horizon Badges');
    await sheet.getByRole('radio', { name: 'Platinum' }).click();
    await sheet.getByRole('textbox', { name: /^Contact email/ }).fill('ops@horizon.example');
    await sheet.getByRole('textbox', { name: /^Website/ }).fill('horizon.example');
    await sheet.getByRole('combobox', { name: 'Booth' }).click();
    await page.getByRole('option', { name: 'B5' }).click();
    await sheet.getByRole('button', { name: 'Add exhibitor' }).click();
    await expect(toastText(page, 'Added Horizon Badges in booth B5')).toBeVisible();
    await expect(card(page, 'Horizon Badges')).toContainText('Booth B5');
    await expect(main(page).getByText('19 exhibitors')).toBeVisible();

    await toMap(page);
    await expect(booth(page, 'B5')).toHaveAccessibleName('Booth B5, Horizon Badges, Platinum, pending');
  });

  test('detail: edit details and contact, booth list disables occupied booths', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await card(page, 'Streamwise').getByRole('button', { name: /^Streamwise,/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Streamwise' });
    await sheet.getByRole('button', { name: 'Edit details' }).click();
    await sheet.getByRole('combobox', { name: 'Booth' }).click();
    await expect(page.getByRole('option', { name: /D3/ })).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('option', { name: 'A3' }).click();
    await sheet.getByRole('combobox', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Pending' }).click();
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(toastText(page, 'Saved changes')).toBeVisible();
    await expect(sheet.getByText('A3', { exact: true })).toBeVisible();

    await sheet.getByRole('button', { name: 'Edit contact' }).click();
    await sheet.getByRole('textbox', { name: /^Email/ }).fill('bad');
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(sheet.getByText('Enter a valid email address, like jane@example.com')).toBeVisible();
    await sheet.getByRole('textbox', { name: /^Email/ }).fill('julia@streamwise.example');
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(toastText(page, 'Saved contact')).toBeVisible();
    await expect(sheet.getByRole('link', { name: 'julia@streamwise.example' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(card(page, 'Streamwise')).toContainText('Booth A3');
  });

  test('staff: link and unlink with undo', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await card(page, 'Lumen AV').getByRole('button', { name: /^Lumen AV,/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Lumen AV' });
    const list = sheet.getByRole('list', { name: 'Lumen AV staff' });
    await expect(list.getByRole('listitem')).toHaveCount(1);
    const add = sheet.getByRole('combobox', { name: 'Add staff' });
    await add.click();
    await page.getByRole('option').first().click();
    await expect(toastText(page, /^Linked .* to Lumen AV$/)).toBeVisible();
    await expect(list.getByRole('listitem')).toHaveCount(2);
    await list.getByRole('button', { name: 'Unlink Lisette Russell' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await page.getByRole('button', { name: 'Undo unlinking Lisette Russell' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(2);
  });

  test('remove from the detail sheet frees the booth and unlinks staff; undo restores', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await card(page, 'Checkpoint Kiosks').getByRole('button', { name: /^Checkpoint Kiosks,/ }).click();
    await page.getByRole('dialog', { name: 'Checkpoint Kiosks' }).getByRole('button', { name: 'Remove exhibitor' }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Remove Checkpoint Kiosks?' });
    await expect(confirm).toContainText('Booth D3 becomes free');
    await expect(confirm).toContainText('1 staff member');
    await confirm.getByRole('button', { name: 'Remove' }).click();
    await expect(toastText(page, 'Removed Checkpoint Kiosks')).toBeVisible();
    await expect(card(page, 'Checkpoint Kiosks')).toHaveCount(0);
    await expect(main(page).getByText('17 exhibitors')).toBeVisible();
    await page.getByRole('button', { name: 'Undo removing Checkpoint Kiosks' }).click();
    await expect(card(page, 'Checkpoint Kiosks')).toContainText('Booth D3');
    await card(page, 'Checkpoint Kiosks').getByRole('button', { name: /^Checkpoint Kiosks,/ }).click();
    await expect(page.getByRole('dialog', { name: 'Checkpoint Kiosks' }).getByRole('list', { name: 'Checkpoint Kiosks staff' }).getByRole('listitem')).toHaveCount(1);
  });

  test('palette Add exhibitor opens the sheet from another view', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'guide' });
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('add exhibitor');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'New exhibitor' })).toBeVisible();
    await expect(page).toHaveURL(/#exhibitors$/);
  });

  test('mobile: the map scrolls sideways and the assign picker is a bottom sheet', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors', width: 390, height: 844 });
    await toMap(page);
    const scroller = main(page).locator('svg[aria-label="Floor map"]').locator('xpath=..');
    const dims = await scroller.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
    expect(dims.sw).toBeGreaterThan(dims.cw);
    expect(dims.sw).toBeGreaterThanOrEqual(720);
    expect(await hasHorizontalOverflow(page, 'paper')).toBe(false);
    await booth(page, 'A1').click();
    const sheet = page.getByRole('dialog', { name: 'Assign booth A1' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('option', { name: /Coverall Insurance/ })).toBeVisible();
  });
});
