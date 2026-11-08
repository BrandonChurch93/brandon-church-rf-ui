import { test, expect, type Page } from '@playwright/test';
import { boot, toastText } from '../helpers';

const main = (page: Page) => page.locator('#paper-main');
const block = (page: Page, title: string) => main(page).locator(`[data-block]`).filter({ hasText: title });
const sessions = (page: Page) => page.evaluate(() => window.__rf.getState().events['evt-rainfocus-summit'].sessions as Array<{ title: string; startMinutes: number; trackId: string }>);
const find = async (page: Page, title: string) => (await sessions(page)).find((x) => x.title === title)!;

test.describe('content · grid', () => {
  test('renders 14 blocks positioned by time and track', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    await expect(main(page).locator('[data-block]')).toHaveCount(14);
    const keynote = (await block(page, 'Opening keynote').boundingBox())!;
    const coffee = (await block(page, 'Registration and coffee').boundingBox())!;
    const hygiene = (await block(page, 'Data hygiene').boundingBox())!;
    expect(keynote.y).toBeGreaterThan(coffee.y + coffee.height - 2);
    expect(Math.abs(keynote.y - hygiene.y)).toBeLessThan(2);
    expect(hygiene.x).toBeGreaterThan(keynote.x + keynote.width);
    expect(Math.round(keynote.height)).toBe(88 - 4);
  });

  test('drag to a free slot moves the session, with undo', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    const b = (await block(page, 'Data hygiene').boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + 20);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + 40, { steps: 3 });
    await page.mouse.move(b.x + b.width / 2, b.y + 20 + 88 * 4, { steps: 15 });
    await page.mouse.up();
    await expect(toastText(page, "Moved 'Data hygiene for large events' to 1:00 PM in Workshop B")).toBeVisible();
    expect((await find(page, 'Data hygiene for large events')).startMinutes).toBe(13 * 60);
    await toastText(page, /^Moved 'Data hygiene/).locator('..').getByRole('button', { name: /Undo/ }).click();
    await expect.poll(async () => (await find(page, 'Data hygiene for large events')).startMinutes).toBe(9 * 60);
  });

  test('drag onto an overlapping slot is refused with the session named', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    const b = (await block(page, 'Data hygiene').boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + 20);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + 40, { steps: 3 });
    await page.mouse.move(b.x + b.width / 2, b.y + 20 + 88 * 1.25, { steps: 10 });
    await page.mouse.up();
    await expect(toastText(page, "That slot overlaps 'Sponsorship packages that sell'")).toBeVisible();
    expect((await find(page, 'Data hygiene for large events')).startMinutes).toBe(9 * 60);
  });

  test('keyboard move: Space, arrows by 15 minutes and by track, Space', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    await block(page, 'Accessibility for event sites').focus();
    for (const k of ['Space', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'Space']) {
      await page.keyboard.press(k);
      await page.waitForTimeout(120);
    }
    await expect(toastText(page, "Moved 'Accessibility for event sites' to 3:00 PM in Workshop B")).toBeVisible();
  });

  test('Enter opens the sheet; overlap validation names the session; save moves it', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    await block(page, 'Partner showcase').focus();
    await page.keyboard.press('Enter');
    const sheet = page.getByRole('dialog', { name: 'Partner showcase' });
    await sheet.getByRole('combobox', { name: 'Start' }).click();
    await page.getByRole('option', { name: '12:00 PM', exact: true }).click();
    await expect(sheet.getByText("Overlaps 'Lunch' (12:00 to 1:15 PM) in this track")).toBeVisible();
    await sheet.getByRole('combobox', { name: 'Start' }).click();
    await page.getByRole('option', { name: '2:30 PM', exact: true }).click();
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(toastText(page, 'Saved Partner showcase')).toBeVisible();
    expect((await find(page, 'Partner showcase')).startMinutes).toBe(14 * 60 + 30);
  });

  test('add a session from an empty slot', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    const col = main(page).locator('[data-track-col]').nth(2);
    const box = (await col.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 88 * 7 + 10);
    const add = col.getByRole('button', { name: 'Add session at 3:00 PM in Workshop B' });
    await expect(add).toBeVisible();
    await add.click();
    const sheet = page.getByRole('dialog', { name: 'New session' });
    await expect(sheet.getByRole('combobox', { name: 'Start' })).toContainText('3:00 PM');
    await sheet.getByRole('button', { name: /Session title/ }).click();
    await page.getByRole('textbox', { name: 'Session title' }).fill('Ask the experts');
    await page.keyboard.press('Enter');
    await page.getByRole('dialog', { name: 'Ask the experts' }).getByRole('button', { name: 'Add session' }).click();
    await expect(block(page, 'Ask the experts')).toBeVisible();
  });

  test('manage tracks: a track with sessions cannot be removed; add and rename', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    await main(page).getByRole('button', { name: 'Manage tracks' }).click();
    const modal = page.getByRole('dialog', { name: 'Manage tracks' });
    await expect(modal.getByRole('button', { name: 'Remove Main Stage' })).toBeDisabled();
    await modal.getByRole('button', { name: 'Add track' }).click();
    await page.keyboard.type('Expo Hall');
    await modal.getByRole('button', { name: 'Save' }).click();
    await expect(main(page).getByText('Expo Hall').first()).toBeVisible();
    await expect(main(page).locator('[data-track-col]')).toHaveCount(4);
  });

  test('track filters and the hidden banner', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    for (const t of ['Main Stage', 'Workshop A', 'Workshop B']) await main(page).getByRole('button', { name: t, exact: true }).click();
    await expect(main(page).getByText('All tracks are hidden.')).toBeVisible();
    await main(page).getByRole('button', { name: 'Show all tracks' }).click();
    await expect(main(page).locator('[data-block]')).toHaveCount(14);
  });

  test('list view and Horizon day tabs', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    await main(page).getByRole('radio', { name: 'List' }).click();
    await expect(main(page).getByRole('group', { name: '9:00 AM' })).toContainText('Opening keynote');
    await page.getByRole('button', { name: /switch event/i }).first().click();
    await page.getByRole('menuitemradio', { name: /Horizon/ }).click();
    await expect(main(page).getByRole('tab')).toHaveCount(2);
    await main(page).getByRole('tab', { name: 'Thu, Feb 4' }).click();
    await expect(main(page).getByText('Lab: migrating to v3')).toBeVisible();
  });

  test('the portal preview reflects content changes', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content' });
    await block(page, 'Registration and coffee').click();
    const sheet = page.getByRole('dialog', { name: 'Registration and coffee' });
    await sheet.getByRole('button', { name: /Session title/ }).click();
    await page.getByRole('textbox', { name: 'Session title' }).fill('Badge pickup and coffee');
    await page.keyboard.press('Enter');
    await page.getByRole('dialog', { name: 'Badge pickup and coffee' }).getByRole('button', { name: 'Save' }).click();
    await page.evaluate(() => (window.location.hash = 'guide'));
    await main(page).getByRole('button', { name: /^Attendee Portal/ }).click();
    await expect(page.getByRole('dialog', { name: 'Attendee Portal' }).getByText('Badge pickup and coffee')).toBeVisible();
  });
});

test.describe('content · mobile', () => {
  test('list only, tracks sheet, bottom sheet editor', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'content', width: 390, height: 844 });
    await expect(main(page).getByRole('radio', { name: 'List' })).toHaveCount(0);
    await main(page).getByRole('button', { name: 'Tracks' }).click();
    await page.getByRole('dialog', { name: 'Tracks' }).getByRole('checkbox', { name: /Main Stage/ }).uncheck();
    await page.keyboard.press('Escape');
    await expect(main(page).getByText('6 sessions')).toBeVisible();
    await main(page).getByRole('button', { name: 'Data hygiene for large events' }).click();
    await expect(page.getByRole('dialog', { name: 'Data hygiene for large events' })).toBeVisible();
  });
});
