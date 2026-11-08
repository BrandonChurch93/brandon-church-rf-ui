import { test, expect, type Page } from '@playwright/test';
import { boot, toastText } from '../helpers';

const enterPaper = (page: Page) => page.evaluate(() => window.__rf.setMode('paper', { instant: true }));

async function renameEvent(page: Page, name: string) {
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('combobox', { name: /Search pages/ }).fill('edit event');
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'Edit event' });
  await sheet.getByLabel('Event name').fill(name);
  await sheet.getByRole('button', { name: 'Save changes' }).click();
  await expect(sheet).toBeHidden();
}

test.describe('persistence', () => {
  test('changes survive a reload; the mode does not', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await renameEvent(page, 'RainFocus Summit 2026');
    await expect(toastText(page, 'Saved changes')).toBeVisible();
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.locator('[data-layer="faithful"]')).toBeVisible();
    await expect(page.locator('[data-layer="paper"]')).toHaveCount(0);
    await enterPaper(page);
    await expect(page.getByRole('button', { name: /RainFocus Summit 2026.*switch event/ })).toBeVisible();
  });

  test('reset demo data restores the seed after a confirm', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await renameEvent(page, 'Renamed');
    await page.getByRole('button', { name: 'FL, Account' }).first().click();
    await page.getByRole('button', { name: 'Reset demo data' }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Reset demo data?' });
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await confirm.getByRole('button', { name: 'Reset' }).click();
    await expect(toastText(page, 'Demo data restored')).toBeVisible();
    expect(await page.evaluate(() => window.__rf.getState().events['evt-rainfocus-summit'].name)).toBe('RainFocus Summit');
  });

  test('a stored version mismatch reseeds and says so', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      localStorage.setItem('rf-ui.v1', JSON.stringify({ state: { events: {}, ui: { theme: 'dark' } }, version: 0 }));
    });
    await boot(page, { keepStorage: true });
    await enterPaper(page);
    await expect(toastText(page, 'Demo data was updated')).toBeVisible();
    expect(await page.evaluate(() => Object.keys(window.__rf.getState().events).length)).toBe(3);
  });

  test('an invalid stored record is restored from the seed with a console warning, not an error', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    page.on('console', (m) => (m.type() === 'error' ? errors : m.type() === 'warning' ? warnings : []).push(m.text()));
    await page.addInitScript(() => {
      if (sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      localStorage.setItem('rf-ui.v1', JSON.stringify({ state: { version: 1, activeEventId: 'evt-horizon-dev-days', events: { 'evt-horizon-dev-days': { id: 'evt-horizon-dev-days', name: 'Broken' } }, eventOrder: ['evt-horizon-dev-days'] }, version: 1 }));
    });
    await boot(page, { keepStorage: true, mode: 'paper' });
    expect(await page.evaluate(() => window.__rf.getState().events['evt-horizon-dev-days'].name)).toBe('Horizon Developer Days');
    expect(warnings.some((w) => w.includes('failed validation'))).toBe(true);
    expect(errors).toEqual([]);
  });

  test('when storage is unavailable the app runs in memory and says so once', async ({ page }) => {
    await page.addInitScript(() => {
      const fail = () => {
        throw new DOMException('QuotaExceededError');
      };
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: { getItem: fail, setItem: fail, removeItem: fail, clear: () => undefined, key: () => null, length: 0 },
      });
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await boot(page, { keepStorage: true, mode: 'paper' });
    await expect(toastText(page, "Changes won't be saved in this browser")).toBeVisible();
    await renameEvent(page, 'In memory');
    expect(await page.evaluate(() => window.__rf.getState().events['evt-rainfocus-summit'].name)).toBe('In memory');
    expect(errors).toEqual([]);
  });
});

test.describe('events', () => {
  test('create event: validation, defaults, and the app switches to it', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendee-types' });
    await page.getByRole('button', { name: /switch event/i }).first().click();
    await page.getByRole('button', { name: 'Create event' }).click();
    const sheet = page.getByRole('dialog', { name: 'Create event' });
    await sheet.getByLabel('Event name').fill('');
    await sheet.getByLabel('Location').focus();
    await sheet.getByLabel('Event name').focus();
    await sheet.getByLabel('Location').focus();
    await expect(sheet.getByText('Event name is required')).toBeVisible();
    await sheet.getByLabel('Event name').fill('Pacific Product Week');
    await sheet.getByLabel('Location').fill('Portland, Oregon');
    await sheet.getByRole('button', { name: 'Create event' }).click();
    await expect(sheet).toBeHidden();
    await expect(toastText(page, 'Created Pacific Product Week')).toBeVisible();
    const state = await page.evaluate(() => {
      const s = window.__rf.getState();
      return { active: s.events[s.activeEventId] };
    });
    expect(state.active.name).toBe('Pacific Product Week');
    expect(state.active.logo).toEqual({ kind: 'monogram', letters: 'PP', swatch: 'grape' });
    expect(state.active.attendeeTypes.map((t: { name: string }) => t.name)).toEqual(['Attendee']);
    expect(state.active.tracks.map((t: { name: string }) => t.name)).toEqual(['Main Stage']);
    expect(state.active.booths).toHaveLength(24);
    expect(state.active.guide.workflows).toHaveLength(0);
    await expect(page.getByRole('button', { name: /Pacific Product Week.*switch event/ })).toBeVisible();
  });

  test('the editor guards unsaved changes', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await page.keyboard.press('ControlOrMeta+k');
    await page.getByRole('combobox', { name: /Search pages/ }).fill('edit event');
    await page.keyboard.press('Enter');
    const sheet = page.getByRole('dialog', { name: 'Edit event' });
    await sheet.getByLabel('Location').fill('Salt Lake City, Utah');
    await page.keyboard.press('Escape');
    const confirm = page.getByRole('alertdialog', { name: 'Discard changes?' });
    await confirm.getByRole('button', { name: 'Keep editing' }).click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Cancel' }).click();
    await confirm.getByRole('button', { name: 'Discard' }).click();
    await expect(sheet).toBeHidden();
    expect(await page.evaluate(() => window.__rf.getState().events['evt-rainfocus-summit'].location)).toBe('Lehi, Utah');
  });
});
