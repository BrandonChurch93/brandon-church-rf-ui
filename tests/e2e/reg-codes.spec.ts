import { test, expect, type Page } from '@playwright/test';
import { boot, toastText } from '../helpers';

const main = (page: Page) => page.locator('#paper-main');
const row = (page: Page, code: string) => main(page).locator('tbody tr').filter({ hasText: code });
const codes = (page: Page) => page.evaluate(() => window.__rf.getState().events['evt-rainfocus-summit'].regCodes as Array<{ code: string; label: string; active: boolean; id: string }>);

test.describe('reg codes', () => {
  test('lists 8 codes with derived status rules on the switch', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'reg-codes' });
    await expect(main(page).locator('tbody tr')).toHaveCount(8);
    await expect(row(page, 'RF-EARLY-25').getByRole('switch')).toBeDisabled();
    await expect(row(page, 'RF-TEAM-OFFSITE').getByRole('switch')).toBeDisabled();
    await row(page, 'RF-EARLY-25').getByRole('group').hover();
    await expect(page.getByRole('tooltip')).toHaveText('Expired codes cannot be activated');
    await main(page).getByRole('button', { name: 'Status filter' }).click();
    await page.getByRole('checkbox', { name: 'Exhausted' }).check();
    await page.keyboard.press('Escape');
    await expect(main(page).locator('tbody tr')).toHaveCount(1);
  });

  test('search ignores dashes and case', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'reg-codes' });
    await main(page).getByRole('searchbox', { name: 'Search codes' }).fill('rfvip');
    await expect(main(page).locator('tbody tr')).toHaveCount(1);
  });

  test('generate: regenerate, uniqueness, uppercase, new row on top', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'reg-codes' });
    await main(page).getByRole('button', { name: 'Generate code' }).click();
    const sheet = page.getByRole('dialog', { name: 'Generate code' });
    const code = sheet.getByRole('textbox', { name: /^Code/ });
    const first = await code.inputValue();
    expect(first).toMatch(/^RF-[A-HJ-KM-NP-Z2-9]{4}-[A-HJ-KM-NP-Z2-9]{4}$/);
    await sheet.getByRole('button', { name: 'Regenerate code' }).click();
    await expect(code).not.toHaveValue(first);
    await sheet.getByLabel('Label').fill('Board comp');
    await code.fill('rf-vip-gold');
    await expect(code).toHaveValue('RF-VIP-GOLD');
    await sheet.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(sheet.getByText('Another code already uses this')).toBeVisible();
    await code.fill('RF-BOARD-26');
    await sheet.getByRole('button', { name: 'Generate', exact: true }).click();
    await expect(toastText(page, 'Generated RF-BOARD-26')).toBeVisible();
    await expect(main(page).locator('tbody tr').first()).toContainText('RF-BOARD-26');
  });

  test('bulk generate 10 and undo removes them all', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'reg-codes' });
    await main(page).getByRole('button', { name: 'Bulk generate' }).click();
    const modal = page.getByRole('dialog', { name: 'Bulk generate codes' });
    await modal.getByRole('button', { name: 'Generate 10 codes' }).click();
    await expect(main(page).locator('tbody tr')).toHaveCount(18);
    expect((await codes(page)).filter((c) => c.label.startsWith('Partner comp ')).map((c) => c.label)).toContain('Partner comp 10');
    await toastText(page, 'Generated 10 codes').locator('..').getByRole('button', { name: /Undo/ }).click();
    await expect(main(page).locator('tbody tr')).toHaveCount(8);
  });

  test('copy code to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await boot(page, { mode: 'paper', hash: 'reg-codes' });
    await row(page, 'RF-SPKR-2026').hover();
    await row(page, 'RF-SPKR-2026').getByRole('button', { name: 'Copy RF-SPKR-2026' }).click();
    await expect(toastText(page, 'Copied RF-SPKR-2026')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('RF-SPKR-2026');
  });

  test('active switch toggles with undo', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'reg-codes' });
    await row(page, 'RF-PRESS-26').getByRole('switch').click();
    await expect(toastText(page, 'Deactivated RF-PRESS-26')).toBeVisible();
    expect((await codes(page)).find((c) => c.code === 'RF-PRESS-26')!.active).toBe(false);
    await toastText(page, 'Deactivated RF-PRESS-26').locator('..').getByRole('button', { name: /Undo/ }).click();
    expect((await codes(page)).find((c) => c.code === 'RF-PRESS-26')!.active).toBe(true);
  });

  test('edit shows uses; remove nulls attendee links and logs activity', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'reg-codes' });
    await row(page, 'RF-VIP-GOLD').locator('td').nth(2).click();
    const sheet = page.getByRole('dialog', { name: 'Edit code' });
    await expect(sheet.getByText('9 of 10 used')).toBeVisible();
    await sheet.getByRole('button', { name: 'Cancel' }).click();
    await row(page, 'RF-VIP-GOLD').hover();
    await row(page, 'RF-VIP-GOLD').getByRole('button', { name: 'Actions for RF-VIP-GOLD' }).click();
    await page.getByRole('menuitem', { name: 'Remove' }).click();
    await page.getByRole('alertdialog', { name: 'Remove RF-VIP-GOLD?' }).getByRole('button', { name: 'Remove' }).click();
    const ev = await page.evaluate(() => window.__rf.getState().events['evt-rainfocus-summit']);
    const id = 'rfs-code-vip';
    expect(ev.attendees.filter((a: { regCodeId: string }) => a.regCodeId === id)).toHaveLength(0);
    expect(ev.attendees.filter((a: { activity: Array<{ text: string }> }) => a.activity[0]?.text === 'Code RF-VIP-GOLD removed')).toHaveLength(9);
  });
});
