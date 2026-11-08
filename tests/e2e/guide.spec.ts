import { test, expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { boot, toastText } from '../helpers';

const main = (page: Page) => page.locator('#paper-main');
const state = (page: Page) => page.evaluate(() => window.__rf.getState());
const switchTo = async (page: Page, name: RegExp) => {
  await page.getByRole('button', { name: /switch event/i }).first().click();
  await page.getByRole('menuitemradio', { name }).click();
  await expect(page.locator('#view-title')).toBeVisible();
  // Let the event-switch choreography (fade out, then the staggered enter) finish.
  await page.waitForTimeout(800);
};

test.describe('guide · hero', () => {
  test('status chip, date and location', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await expect(main(page).getByText('38 days out')).toBeVisible();
    await expect(main(page).getByText('December 15, 2026 · Lehi, Utah')).toBeVisible();
  });

  test('inline rename: Enter commits, Escape cancels, empty is invalid', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    const name = main(page).getByRole('button', { name: /Event name: RainFocus Summit/ });
    await name.click();
    const input = main(page).getByRole('textbox', { name: 'Event name' });
    await input.fill('');
    await input.press('Enter');
    await expect(main(page).getByText('Event name is required')).toBeVisible();
    await input.fill('Summit 2026');
    await input.press('Escape');
    await expect(main(page).getByRole('button', { name: /Event name: RainFocus Summit\./ })).toBeVisible();
    await main(page).getByRole('button', { name: /Event name:/ }).click();
    await main(page).getByRole('textbox', { name: 'Event name' }).fill('RainFocus Summit 2026');
    await page.keyboard.press('Enter');
    await expect(main(page).getByRole('button', { name: /Event name: RainFocus Summit 2026/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /RainFocus Summit 2026.*switch event/ })).toBeVisible();
  });

  test('logo editor: upload, zoom, save, propagates to the rail', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await main(page).getByRole('button', { name: 'Change event logo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Change event logo' });
    await dialog.locator('input[type=file]').setInputFiles(resolve('tests/fixtures/logo.png'));
    await expect(dialog.getByRole('img', { name: 'Logo preview' })).toBeVisible();
    await dialog.getByRole('slider').fill('2');
    await dialog.getByRole('button', { name: 'Save logo' }).click();
    await expect(dialog).toBeHidden();
    const logo = (await state(page)).events['evt-rainfocus-summit'].logo;
    expect(logo.kind).toBe('custom');
    expect(logo.dataUrl.startsWith('data:image/png')).toBe(true);
    await expect(page.getByRole('complementary', { name: 'App' }).locator('img[src^="data:image/png"]')).toHaveCount(1);
  });

  test('logo editor rejects files over 8 MB', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await main(page).getByRole('button', { name: 'Change event logo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Change event logo' });
    await dialog.locator('input[type=file]').setInputFiles({ name: 'huge.png', mimeType: 'image/png', buffer: Buffer.alloc(9 * 1024 * 1024) });
    await expect(dialog.getByText('That image is larger than 8 MB. Choose a smaller one.')).toBeVisible();
  });
});

test.describe('guide · module', () => {
  test('progress count and collapse that persists', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await expect(main(page).getByRole('progressbar', { name: 'Setup progress, 4 of 8 configured' })).toBeVisible();
    const header = main(page).getByRole('button', { name: /Attendee.*Collapse/ });
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await header.click();
    await expect(main(page).getByRole('button', { name: /Attendee.*Expand/ })).toHaveAttribute('aria-expanded', 'false');
    await expect(main(page).getByText('4 of 8 configured').first()).toBeVisible();
    expect((await state(page)).events['evt-rainfocus-summit'].moduleCollapsed).toBe(true);
  });

  test('Communications sheet validates, saves, and marks configured with the check animation', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await main(page).getByRole('button', { name: /^Communications\s*Not configured/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Communications' });
    await sheet.getByLabel('Reply-to').fill('nope');
    await sheet.getByLabel('Sender name').focus();
    await expect(sheet.getByText('Enter a valid email address, like help@example.com')).toBeVisible();
    await sheet.getByLabel('Reply-to').fill('summit@rainfocus.example');
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(sheet).toBeHidden();
    await expect(main(page).locator('[data-check="drawing"]')).toHaveCount(1);
    await expect(main(page).getByRole('button', { name: /^Communications\s*Configured/ })).toBeVisible();
    await expect(main(page).getByRole('progressbar', { name: 'Setup progress, 5 of 8 configured' })).toBeVisible();
  });

  test('General sheet enforces the registration window', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await main(page).getByRole('button', { name: /^General\s*Configured/ }).click();
    const sheet = page.getByRole('dialog', { name: 'General' });
    await sheet.getByLabel('Registration closes').fill('Dec 20, 2026');
    await sheet.getByLabel('Registration closes').blur();
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(sheet.getByText('Must be on or before the event starts')).toBeVisible();
  });

  test('Attributes: the required pair cannot be removed; others remove with undo', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await main(page).getByRole('button', { name: /^Attendee attributes/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Attendee attributes' });
    await expect(sheet.getByRole('button', { name: 'Remove Full name' })).toBeDisabled();
    await sheet.getByRole('button', { name: 'Remove Company' }).click();
    await expect(sheet.getByRole('textbox', { name: 'Label' })).toHaveCount(5);
    await toastText(page, 'Removed Company').locator('..').getByRole('button', { name: /Undo/ }).click();
    await expect(sheet.getByRole('textbox', { name: 'Label' })).toHaveCount(6);
    await sheet.getByRole('button', { name: 'Add attribute' }).click();
    await expect(sheet.getByRole('textbox', { name: 'Label' }).last()).toBeFocused();
    await page.keyboard.type('T-shirt size');
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(sheet).toBeHidden();
    const fields = (await state(page)).events['evt-rainfocus-summit'].guide.settings.attributes.fields;
    expect(fields.map((f: { label: string }) => f.label)).toContain('T-shirt size');
  });
});

test.describe('guide · workflows', () => {
  test('Horizon is locked until General is configured, then unlocks', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await switchTo(page, /Horizon/);
    await expect(main(page).getByText('Locked')).toBeVisible();
    await main(page).getByText('Locked').hover();
    await expect(page.getByRole('tooltip')).toHaveText('Configure general settings before creating registration workflows.');
    await main(page).getByRole('button', { name: /^General\s*Not configured/ }).click();
    const sheet = page.getByRole('dialog', { name: 'General' });
    await sheet.getByRole('combobox', { name: 'Event type' }).click();
    await page.getByRole('option', { name: 'Conference' }).click();
    await sheet.getByLabel('Capacity').fill('300');
    await sheet.getByLabel('Registration opens').fill('Dec 1, 2026');
    await sheet.getByLabel('Registration closes').fill('Jan 30, 2027');
    await sheet.getByLabel('Attendee support email').fill('devdays@horizon.example');
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(sheet).toBeHidden();
    await expect(main(page).getByText('Locked')).toHaveCount(0);
    await main(page).getByRole('button', { name: 'Add registration workflow' }).click();
    await expect(page.getByRole('dialog', { name: 'Add a registration workflow' })).toBeVisible();
  });

  test('template picker adds a card; Start from scratch opens the editor', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await main(page).getByRole('button', { name: 'Add registration workflow' }).click();
    const picker = page.getByRole('dialog', { name: 'Add a registration workflow' });
    await picker.getByRole('radio', { name: /^VIP/ }).click();
    await picker.getByRole('button', { name: 'Create workflow' }).click();
    await expect(main(page).getByRole('button', { name: /^VIP Registration, Draft/ })).toBeVisible();
    await main(page).getByRole('button', { name: 'Add registration workflow' }).click();
    await picker.getByRole('radio', { name: /^Start from scratch/ }).dblclick();
    await expect(page.getByRole('dialog', { name: 'New workflow' })).toBeVisible();
  });

  test('editor: Live needs a step; save updates the card', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await main(page).getByRole('button', { name: /^Staff Registration, Draft/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Staff Registration' });
    for (const n of ['Details', 'Sessions', 'Confirmation']) await sheet.getByRole('button', { name: `Remove ${n}` }).click();
    await expect(sheet.getByRole('radio', { name: 'Live' })).toBeDisabled();
    await sheet.getByRole('button', { name: 'Add step' }).click();
    await page.getByRole('menuitem', { name: /Details/ }).click();
    await sheet.getByRole('radio', { name: 'Live' }).click();
    await sheet.getByRole('button', { name: 'Save' }).click();
    await expect(sheet).toBeHidden();
    await expect(main(page).getByRole('button', { name: /^Staff Registration, Live/ })).toBeVisible();
    await expect(main(page).getByRole('progressbar', { name: /5 of 8/ })).toBeVisible();
  });

  test('hover actions, remove with confirm and undo restores position', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    const card = main(page).locator('[data-flip-id]').filter({ hasText: 'Employee Registration' });
    await card.hover();
    await expect(card.getByRole('button', { name: 'Edit Employee Registration' })).toBeVisible();
    await card.getByRole('button', { name: 'More actions for Employee Registration' }).click();
    await page.getByRole('menuitem', { name: 'Remove' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click();
    await expect(main(page).getByRole('button', { name: /^Employee Registration/ })).toHaveCount(0);
    await toastText(page, 'Removed Employee Registration').locator('..').getByRole('button', { name: 'Undo removing Employee Registration' }).click();
    await expect(main(page).getByRole('button', { name: /^Employee Registration/ })).toBeVisible();
    const names = (await state(page)).events['evt-rainfocus-summit'].guide.workflows.map((w: { name: string }) => w.name);
    expect(names).toEqual(['Attendee Registration', 'Employee Registration', 'Staff Registration']);
  });

  test('rename from the menu and duplicate', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    const card = main(page).locator('[data-flip-id]').filter({ hasText: 'Staff Registration' });
    await card.hover();
    await card.getByRole('button', { name: 'More actions for Staff Registration' }).click();
    await page.getByRole('menuitem', { name: 'Rename' }).click();
    const input = main(page).getByRole('textbox', { name: 'Workflow name' });
    await expect(input).toBeFocused();
    await input.fill('Crew Registration');
    await input.press('Enter');
    await expect(main(page).getByRole('button', { name: /^Crew Registration/ })).toBeVisible();
    const crew = main(page).locator('[data-flip-id]').filter({ hasText: 'Crew Registration' });
    await crew.hover();
    await crew.getByRole('button', { name: /More actions/ }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(main(page).getByRole('button', { name: /^Crew Registration copy/ })).toBeVisible();
  });

  test('reorder by keyboard', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    const handle = main(page).getByRole('button', { name: 'Reorder Staff Registration' });
    await handle.focus();
    for (const key of ['Space', 'ArrowLeft', 'ArrowLeft', 'Space']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    }
    await expect.poll(async () => (await state(page)).events['evt-rainfocus-summit'].guide.workflows[0].name).toBe('Staff Registration');
  });

  test('reorder by pointer drag', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    const from = main(page).getByRole('button', { name: 'Reorder Attendee Registration' });
    const target = main(page).locator('[data-flip-id]').filter({ hasText: 'Staff Registration' });
    await main(page).locator('[data-flip-id]').first().hover();
    const a = (await from.boundingBox())!;
    const b = (await target.boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + 40, a.y + 10, { steps: 4 });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect.poll(async () => (await state(page)).events['evt-rainfocus-summit'].guide.workflows.at(-1).name).toBe('Attendee Registration');
  });

  test('show all appears past six workflows', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    for (const t of ['Speaker', 'Press', 'VIP', 'Exhibitor staff']) {
      await main(page).getByRole('button', { name: 'Add registration workflow' }).click();
      await page.getByRole('dialog', { name: 'Add a registration workflow' }).getByRole('radio', { name: new RegExp(`^${t}`) }).dblclick();
    }
    await expect(main(page).locator('[data-flip-id]')).toHaveCount(6);
    await main(page).getByRole('button', { name: 'Show all 7' }).click();
    await expect(main(page).locator('[data-flip-id]')).toHaveCount(7);
    await main(page).getByRole('button', { name: 'Show less' }).click();
    await expect(main(page).locator('[data-flip-id]')).toHaveCount(6);
  });
});

test.describe('guide · experiences', () => {
  test('portal preview reflects content and settings; save marks calendar configured', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await main(page).getByRole('button', { name: /^Attendee Portal/ }).click();
    const portal = page.getByRole('dialog', { name: 'Attendee Portal' });
    await expect(portal.getByText('Registration and coffee')).toBeVisible();
    await portal.getByRole('switch', { name: 'Show networking' }).click();
    await expect(portal.getByText('Networking', { exact: true })).toBeVisible();
    await portal.getByRole('combobox', { name: 'Accent color' }).click();
    await page.getByRole('option', { name: 'Teal' }).click();
    await portal.getByRole('button', { name: 'Save' }).click();
    expect((await state(page)).events['evt-rainfocus-summit'].guide.experiences.portal).toEqual({ showAgenda: true, showNetworking: true, accent: 'teal' });
    await main(page).getByRole('button', { name: /^Attendee Calendar, not configured/ }).click();
    const cal = page.getByRole('dialog', { name: 'Attendee Calendar' });
    await expect(cal.getByText('Opening keynote')).toBeVisible();
    await cal.getByRole('switch', { name: 'Show room names' }).click();
    await expect(cal.getByText(/Ballroom A/)).toHaveCount(0);
    await cal.getByRole('button', { name: 'Save' }).click();
    await expect(main(page).getByRole('button', { name: /^Attendee Calendar, configured/ })).toBeVisible();
  });
});

test('landing beats: progress bar and chip animate after the transition', async ({ page }) => {
  await boot(page);
  await page.locator('[data-pill]').click();
  await page.waitForFunction(() => window.__rf.transition !== null);
  await page.evaluate(() => window.__rf.transition!.pause());
  await page.evaluate(() => window.__rf.transition!.seek(1.1));
  const early = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[role=progressbar] > div')!).width));
  await page.evaluate(() => window.__rf.transition!.seek(1.9));
  const late = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[role=progressbar] > div')!).width));
  expect(early).toBeLessThan(late);
  await page.evaluate(() => window.__rf.transition!.play());
  await expect(page.locator('[data-transitioning]')).toHaveCount(0, { timeout: 5000 });
});
