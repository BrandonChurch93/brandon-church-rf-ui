import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { boot, toastText } from '../helpers';

const main = (page: Page) => page.locator('#paper-main');
const rows = (page: Page) => main(page).locator('tbody tr[data-flip-id]');
const count = (page: Page) => main(page).getByText(/attendees$/).first();
const state = (page: Page) => page.evaluate(() => window.__rf.getState());
const open = (page: Page, opts = {}) => boot(page, { mode: 'paper', hash: 'attendees', ...opts });

test.describe('attendees · desktop', () => {
  test('seeded table: 240 attendees, 25 per page, default newest first', async ({ page }) => {
    await open(page);
    await expect(count(page)).toHaveText('240 attendees');
    await expect(rows(page)).toHaveCount(25);
    await expect(main(page).getByText('1 to 25 of 240')).toBeVisible();
    await expect(main(page).getByRole('columnheader', { name: 'Registered' })).toHaveAttribute('aria-sort', 'descending');
  });

  test('search matches name, email and company', async ({ page }) => {
    await open(page);
    await main(page).getByRole('searchbox', { name: 'Search attendees' }).fill('priya');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('Priya Natarajan');
    await expect(count(page)).toHaveText('1 of 240 attendees');
    await main(page).getByRole('searchbox', { name: 'Search attendees' }).fill('lumenav.example');
    await expect(rows(page).first()).toContainText('lumenav.example');
    await main(page).getByRole('button', { name: 'Clear filters' }).click();
    await expect(count(page)).toHaveText('240 attendees');
  });

  test('type, status and package filters', async ({ page }) => {
    await open(page);
    await main(page).getByRole('button', { name: 'Type filter' }).click();
    await page.getByRole('checkbox', { name: 'Speaker' }).check();
    await page.keyboard.press('Escape');
    await expect(count(page)).toHaveText('14 of 240 attendees');
    await expect(main(page).getByRole('button', { name: 'Type filter, 1 selected' })).toBeVisible();
    await main(page).getByRole('button', { name: 'Status filter' }).click();
    await page.getByRole('checkbox', { name: 'Cancelled' }).check();
    await page.keyboard.press('Escape');
    await expect(main(page).getByText('No attendees match')).toBeVisible();
    await main(page).getByRole('button', { name: 'Clear Status filter' }).click();
    await main(page).getByRole('button', { name: 'Clear Type filter' }).click();
    await main(page).getByRole('button', { name: 'Package filter' }).click();
    await page.getByRole('checkbox', { name: 'VIP Experience' }).check();
    await page.keyboard.press('Escape');
    await expect(count(page)).toHaveText('9 of 240 attendees');
  });

  test('sorting cycles ascending, descending, default', async ({ page }) => {
    await open(page);
    const header = main(page).getByRole('columnheader', { name: 'Name' });
    await header.getByRole('button').click();
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    const firstAsc = await rows(page).first().locator('td').nth(1).innerText();
    await header.getByRole('button').click();
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(await rows(page).first().locator('td').nth(1).innerText()).not.toBe(firstAsc);
    await header.getByRole('button').click();
    await expect(header).toHaveAttribute('aria-sort', 'none');
    for (const col of ['Company', 'Type', 'Package', 'Status']) {
      await main(page).getByRole('columnheader', { name: col }).getByRole('button').click();
      await expect(main(page).getByRole('columnheader', { name: col })).toHaveAttribute('aria-sort', 'ascending');
    }
  });

  test('pagination and page size', async ({ page }) => {
    await open(page);
    await main(page).getByRole('button', { name: 'Page 10' }).click();
    await expect(main(page).getByText('226 to 240 of 240')).toBeVisible();
    await expect(rows(page)).toHaveCount(15);
    await main(page).getByRole('combobox', { name: 'Rows per page' }).click();
    await page.getByRole('option', { name: '100 per page' }).click();
    await expect(main(page).getByText('1 to 100 of 240')).toBeVisible();
    await main(page).getByRole('button', { name: 'Next page' }).click();
    await expect(main(page).getByText('101 to 200 of 240')).toBeVisible();
  });

  test('selection, bulk status change with undo, select all', async ({ page }) => {
    await open(page);
    await rows(page).nth(0).getByRole('checkbox').check();
    await rows(page).nth(1).getByRole('checkbox').check();
    const bar = main(page).getByRole('region', { name: 'Bulk actions' });
    await expect(bar).toContainText('2 selected');
    await bar.getByRole('button', { name: 'Change status' }).click();
    await page.getByRole('menuitem', { name: 'Pending' }).click();
    await expect(rows(page).nth(0)).toContainText('Pending');
    await toastText(page, 'Changed 2 attendees to Pending').locator('..').getByRole('button', { name: /Undo/ }).click();
    await expect(rows(page).nth(0)).toContainText('Registered');
    await main(page).getByRole('checkbox', { name: 'Select all attendees on this page' }).check();
    await expect(bar).toContainText('25 selected');
    await bar.getByRole('button', { name: 'Select all 240' }).click();
    await expect(bar).toContainText('240 selected');
    await page.locator('#paper-main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Escape');
    await expect(bar).toBeHidden();
  });

  test('remove with confirm, undo restores the exact position', async ({ page }) => {
    await open(page);
    const second = await rows(page).nth(1).locator('td').nth(1).innerText();
    await rows(page).nth(1).getByRole('checkbox').check();
    await rows(page).nth(2).getByRole('checkbox').check();
    await main(page).getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: 'Remove' }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Remove 2 attendees?' });
    await confirm.getByRole('button', { name: 'Remove 2 attendees' }).click();
    await expect(count(page)).toHaveText('238 attendees');
    await toastText(page, 'Removed 2 attendees').locator('..').getByRole('button', { name: /Undo/ }).click();
    await expect(count(page)).toHaveText('240 attendees');
    expect(await rows(page).nth(1).locator('td').nth(1).innerText()).toBe(second);
  });

  test('add attendee: duplicate email, then success, flash and activity', async ({ page }) => {
    await open(page);
    await main(page).getByRole('button', { name: 'Add attendee' }).click();
    const sheet = page.getByRole('dialog', { name: 'Add attendee' });
    await sheet.getByLabel('First name').fill('Jane');
    await sheet.getByLabel('Last name').fill('Doe');
    await sheet.getByLabel('Email').fill('priya.natarajan@rainfocus.example');
    await sheet.getByRole('button', { name: 'Add attendee' }).click();
    await expect(sheet.getByText('An attendee with this email already exists')).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'View Priya Natarajan' })).toBeVisible();
    await sheet.getByLabel('Email').fill('jane.doe@example.com');
    await sheet.getByRole('button', { name: 'Add attendee' }).click();
    await expect(sheet).toBeHidden();
    await expect(toastText(page, 'Added Jane Doe')).toBeVisible();
    await expect(rows(page).first()).toContainText('Jane Doe');
    await expect(count(page)).toHaveText('241 attendees');
    const jane = (await state(page)).events['evt-rainfocus-summit'].attendees.find((a: { email: string }) => a.email === 'jane.doe@example.com');
    expect(jane.activity[0].text).toBe('Added manually');
  });

  test('detail sheet: explicit edit, save, activity appended', async ({ page }) => {
    await open(page);
    await rows(page).first().locator('td').nth(4).click();
    const sheet = page.getByRole('dialog').filter({ has: page.getByText('Activity') });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Edit', exact: true }).click();
    await sheet.getByRole('combobox', { name: 'Attendee type' }).click();
    await page.getByRole('option', { name: 'Press' }).click();
    await sheet.getByLabel('Notes').fill('Prefers aisle seating.');
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(toastText(page, 'Saved changes')).toBeVisible();
    await expect(sheet.getByText('Type changed to Press')).toBeVisible();
    await expect(sheet.getByText('Notes edited')).toBeVisible();
    await expect(sheet.getByText('Prefers aisle seating.')).toBeVisible();
  });

  test('row menu: resend confirmation, change type popover, cancel and reinstate', async ({ page }) => {
    await open(page);
    const row = rows(page).first();
    const name = await row.locator('td').nth(1).locator('button').innerText();
    await row.hover();
    await row.getByRole('button', { name: `Actions for ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Resend confirmation' }).click();
    await expect(toastText(page, /^Confirmation sent to /)).toBeVisible();
    await row.getByRole('button', { name: `Actions for ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Change type' }).click();
    await page.getByRole('menuitemradio', { name: 'Staff', exact: true }).click();
    await expect(row).toContainText('Staff');
    await row.getByRole('button', { name: `Actions for ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Cancel registration' }).click();
    await expect(row).toContainText('Cancelled');
    await row.getByRole('button', { name: `Actions for ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Reinstate' }).click();
    await expect(row).toContainText('Registered');
  });

  test('keyboard: rows move with arrows, Enter opens, Space selects', async ({ page }) => {
    await open(page);
    await main(page).getByRole('rowgroup').last().focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(main(page).getByRole('region', { name: 'Bulk actions' })).toContainText('1 selected');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog').filter({ has: page.getByText('Activity') })).toBeVisible();
  });

  test('export CSV downloads the filtered rows', async ({ page }) => {
    await open(page);
    await main(page).getByRole('button', { name: 'Type filter' }).click();
    await page.getByRole('checkbox', { name: 'VIP', exact: true }).check();
    await page.keyboard.press('Escape');
    const [download] = await Promise.all([page.waitForEvent('download'), main(page).getByRole('button', { name: 'Export CSV' }).click()]);
    expect(download.suggestedFilename()).toBe('rainfocus-summit-attendees-2026-11-07.csv');
    const csv = readFileSync((await download.path())!, 'utf8').trim().split('\n');
    expect(csv[0]).toBe('Name,Email,Phone,Company,Job title,Type,Package,Reg code,Status,Registered');
    expect(csv).toHaveLength(10);
    await expect(toastText(page, 'Exported 9 attendees')).toBeVisible();
  });

  test('palette opens an attendee and the add sheet', async ({ page }) => {
    await open(page, { hash: 'guide' });
    await page.keyboard.press('ControlOrMeta+k');
    await page.getByRole('combobox', { name: /Search pages/ }).fill('natarajan');
    await page.keyboard.press('ArrowDown');
    const opt = page.getByRole('option', { name: /Priya Natarajan/ });
    await opt.click();
    await expect(page.getByRole('dialog', { name: 'Priya Natarajan' })).toBeVisible();
  });
});

test.describe('attendees · mobile 390', () => {
  test('cards, load more, filters sheet with live count', async ({ page }) => {
    await open(page, { width: 390, height: 844 });
    const cards = main(page).locator('[data-flip-id]');
    await expect(cards).toHaveCount(25);
    await main(page).getByRole('button', { name: /^Load 25 more/ }).click();
    await expect(cards).toHaveCount(50);
    await main(page).getByRole('button', { name: 'Filters' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await sheet.getByRole('checkbox', { name: 'Speaker' }).check();
    await sheet.getByRole('button', { name: 'Show 14 attendees' }).click();
    await expect(cards).toHaveCount(14);
    await expect(main(page).getByRole('button', { name: 'Filters, 1 active' })).toBeVisible();
  });

  test('selection mode: bulk bar above the tab bar, the pill steps aside', async ({ page }) => {
    await open(page, { width: 390, height: 844 });
    await main(page).getByRole('button', { name: 'Select', exact: true }).click();
    await main(page).getByRole('button', { name: /^Select / }).first().click();
    await expect(main(page).getByRole('region', { name: 'Bulk actions' })).toContainText('1 selected');
    await expect.poll(async () => (await page.locator('[data-pill]').boundingBox())!.y).toBeGreaterThanOrEqual(844);
    await main(page).getByRole('button', { name: 'Done' }).click();
    await expect(main(page).getByRole('region', { name: 'Bulk actions' })).toBeHidden();
    await expect.poll(async () => (await page.locator('[data-pill]').boundingBox())!.y).toBeLessThan(844);
  });

  test('tap opens the detail as a bottom sheet', async ({ page }) => {
    await open(page, { width: 390, height: 844 });
    await main(page).locator('[data-flip-id]').first().getByRole('button').first().click();
    await expect(page.getByRole('dialog').filter({ has: page.getByText('Activity') })).toBeVisible();
  });
});
