// Screenshot catalog for human review (docs/19-testing.md, Visual catalog). Not a diff.
import { test, expect, type Page } from '@playwright/test';
import { boot } from '../helpers';
import { capture, settle } from './helpers';

const WIDTHS = [1447, 1024, 768, 390, 320];
const VIEWS = ['guide', 'attendees', 'attendee-types', 'packages', 'reg-codes', 'discounts', 'content', 'exhibitors'];
const heightFor = (w: number) => (w >= 900 ? 1024 : 844);

test.describe.configure({ mode: 'parallel' });

test.describe('faithful', () => {
  for (const w of WIDTHS) {
    test(`faithful ${w}`, async ({ page }) => {
      await boot(page, { width: w, height: heightFor(w), reducedMotion: true });
      await settle(page, 300);
      await capture(page, `faithful/light/page-${w}.png`);
    });
  }
  test('faithful 390 drawer open', async ({ page }) => {
    await boot(page, { width: 390, height: 844, reducedMotion: true });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await settle(page, 400);
    await capture(page, 'faithful/light/drawer-390.png', { full: false });
  });
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`paper ${theme}`, () => {
    for (const w of WIDTHS) {
      test(`all views ${theme} ${w}`, async ({ page }) => {
        await boot(page, { mode: 'paper', theme, width: w, height: heightFor(w), reducedMotion: true });
        for (const v of VIEWS) {
          await page.evaluate((h) => (window.location.hash = h), v);
          await expect(page.locator('#view-title')).toBeVisible();
          await settle(page, 600);
          await capture(page, `paper/${theme}/${v}-${w}.png`);
        }
      });
    }
  });
}

async function shot(page: Page, rel: string) {
  await settle(page, 600);
  await capture(page, rel, { full: false });
}

for (const theme of ['light', 'dark'] as const) {
  test(`states ${theme}`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await boot(page, { mode: 'paper', theme, reducedMotion: true });
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('re');
    await shot(page, `states/${theme}/palette-1447.png`);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'FL, Account' }).first().click();
    await shot(page, `states/${theme}/account-menu-1447.png`);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /switch event/i }).first().click();
    await shot(page, `states/${theme}/event-switcher-1447.png`);
    await page.keyboard.press('Escape');
    for (const code of ['RF-VIP', 'RF-SPKR', 'RF-STAFF']) {
      await page.keyboard.press('ControlOrMeta+k');
      await page.getByRole('combobox', { name: /Search pages/ }).fill(code);
      await page.keyboard.press('Enter');
    }
    await shot(page, `states/${theme}/toasts-1447.png`);
    await page.getByRole('button', { name: 'FL, Account' }).first().click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await shot(page, `states/${theme}/sign-in-1447.png`);
  });

  test(`mobile states ${theme}`, async ({ page }) => {
    await boot(page, { mode: 'paper', theme, width: 390, height: 844, reducedMotion: true });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await shot(page, `states/${theme}/drawer-390.png`);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.keyboard.type('a');
    await shot(page, `states/${theme}/palette-390.png`);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'FL, Account' }).click();
    await shot(page, `states/${theme}/account-390.png`);
  });

  test(`hover states ${theme}`, async ({ page }) => {
    await boot(page, { mode: 'paper', theme });
    await page.getByRole('navigation', { name: 'Event navigation' }).getByRole('link', { name: 'Content' }).hover();
    await page.waitForTimeout(700);
    await capture(page, `states/${theme}/hover-nav-1447.png`, { full: false });
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const [w, h] of [
    [1447, 1024],
    [390, 844],
  ] as const) {
    for (const dir of ['in', 'out'] as const) {
      test(`transition frames ${dir} ${theme} ${w}`, async ({ page }) => {
        await boot(page, { width: w, height: h, theme, mode: dir === 'out' ? 'paper' : undefined });
        await page.waitForTimeout(1900);
        await page.locator('[data-pill]').click();
        await page.waitForFunction(() => window.__rf.transition !== null);
        await page.evaluate(() => window.__rf.transition!.pause());
        for (const t of [0.3, 0.65, 1.0, 1.4]) {
          await page.evaluate((s) => window.__rf.transition!.seek(s), t);
          await page.waitForTimeout(60);
          await capture(page, `transition/${theme}/${dir}-${w}-${t * 1000}.png`, { full: false });
        }
        await page.evaluate(() => window.__rf.transition!.play());
        await expect(page.locator('[data-transitioning]')).toHaveCount(0, { timeout: 5000 });
        await page.waitForTimeout(300);
        await capture(page, `transition/${theme}/${dir}-${w}-2000.png`, { full: false });
      });
    }
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`guide states ${theme}`, async ({ page }) => {
    await boot(page, { mode: 'paper', theme, reducedMotion: true });
    const main = page.locator('#paper-main');
    await main.getByRole('button', { name: /^General\s*Configured/ }).click();
    await shot(page, `states/${theme}/guide-sheet-1447.png`);
    await page.keyboard.press('Escape');
    await main.getByRole('button', { name: 'Add registration workflow' }).click();
    await shot(page, `states/${theme}/template-picker-1447.png`);
    await page.keyboard.press('Escape');
    await main.getByRole('button', { name: 'Change event logo' }).click();
    await shot(page, `states/${theme}/logo-editor-1447.png`);
    await page.keyboard.press('Escape');
    await main.getByRole('button', { name: /^Attendee Portal/ }).click();
    await shot(page, `states/${theme}/portal-preview-1447.png`);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await main.locator('[data-flip-id]').first().hover();
    await shot(page, `states/${theme}/hover-card-1447.png`);
    await page.getByRole('button', { name: /switch event/i }).first().click();
    await page.getByRole('menuitemradio', { name: /Horizon/ }).click();
    await page.waitForTimeout(900);
    await main.getByText('Locked').hover();
    await shot(page, `states/${theme}/horizon-locked-1447.png`);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`attendees states ${theme}`, async ({ page }) => {
    await boot(page, { mode: 'paper', theme, hash: 'attendees', reducedMotion: true });
    const main = page.locator('#paper-main');
    const rows = main.locator('tbody tr[data-flip-id]');
    await rows.nth(0).getByRole('checkbox').check();
    await rows.nth(2).getByRole('checkbox').check();
    await rows.nth(4).hover();
    await shot(page, `states/${theme}/attendees-selection-1447.png`);
    await page.keyboard.press('Escape');
    await rows.first().locator('td').nth(4).click();
    await shot(page, `states/${theme}/attendee-detail-1447.png`);
    await page.keyboard.press('Escape');
    await main.getByRole('button', { name: 'Type filter' }).click();
    await shot(page, `states/${theme}/attendees-filter-1447.png`);
  });
  test(`attendees mobile ${theme}`, async ({ page }) => {
    await boot(page, { mode: 'paper', theme, hash: 'attendees', width: 390, height: 844, reducedMotion: true });
    const main = page.locator('#paper-main');
    await main.getByRole('button', { name: 'Select', exact: true }).click();
    await main.getByRole('button', { name: /^Select / }).nth(1).click();
    await shot(page, `states/${theme}/attendees-select-390.png`);
    await main.getByRole('button', { name: 'Done' }).click();
    await main.getByRole('button', { name: 'Filters' }).click();
    await shot(page, `states/${theme}/attendees-filters-390.png`);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`P7 states ${theme}`, async ({ page }) => {
    await boot(page, { mode: 'paper', theme, hash: 'attendee-types', reducedMotion: true });
    const main = page.locator('#paper-main');
    await main.getByRole('button', { name: /^Speaker\./ }).click();
    await shot(page, `states/${theme}/types-editor-1447.png`);
    await page.keyboard.press('Escape');
    await page.evaluate(() => (window.location.hash = 'packages'));
    await main.getByRole('button', { name: /^Full Conference,/ }).click();
    await shot(page, `states/${theme}/package-editor-1447.png`);
    await page.keyboard.press('Escape');
    await page.evaluate(() => (window.location.hash = 'reg-codes'));
    await main.getByRole('button', { name: 'Bulk generate' }).click();
    await shot(page, `states/${theme}/bulk-generate-1447.png`);
    await page.keyboard.press('Escape');
    await page.evaluate(() => (window.location.hash = 'discounts'));
    await main.getByRole('button', { name: /^Early bird\./ }).click();
    await shot(page, `states/${theme}/discount-editor-1447.png`);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`content states ${theme}`, async ({ page }) => {
    await boot(page, { mode: 'paper', theme, hash: 'content', reducedMotion: true });
    const main = page.locator('#paper-main');
    const b = (await main.locator('[data-block]').filter({ hasText: 'Data hygiene' }).boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + 20);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + 40, { steps: 3 });
    await page.mouse.move(b.x + b.width / 2, b.y + 20 + 88 * 4, { steps: 10 });
    await page.waitForTimeout(300);
    await capture(page, `states/${theme}/content-drag-1447.png`, { full: false });
    await page.mouse.up();
    await main.locator('[data-block]').filter({ hasText: 'Opening keynote' }).click();
    await shot(page, `states/${theme}/session-sheet-1447.png`);
    await page.keyboard.press('Escape');
    await main.getByRole('button', { name: 'Manage tracks' }).click();
    await shot(page, `states/${theme}/manage-tracks-1447.png`);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`exhibitors states ${theme}`, async ({ page }) => {
    await boot(page, { mode: 'paper', theme, hash: 'exhibitors', reducedMotion: true });
    const main = page.locator('#paper-main');
    await main.locator('[data-flip-id]').first().hover();
    await capture(page, `states/${theme}/exhibitors-card-hover-1447.png`, { full: false });
    await main.getByRole('radio', { name: 'Floor map' }).click();
    await main.locator('[data-booth="D2"]').hover();
    await page.waitForTimeout(600);
    await capture(page, `states/${theme}/exhibitors-map-hover-1447.png`, { full: false });
    await main.locator('[data-booth="C6"]').click();
    await shot(page, `states/${theme}/exhibitors-assign-1447.png`);
    await page.keyboard.press('Escape');
    await main.locator('[data-booth="D3"]').click();
    await shot(page, `states/${theme}/exhibitor-detail-1447.png`);
    await page.keyboard.press('Escape');
    await main.getByRole('button', { name: 'Add exhibitor' }).first().click();
    await shot(page, `states/${theme}/exhibitor-add-1447.png`);
  });
  test(`exhibitors mobile ${theme}`, async ({ page }) => {
    await boot(page, { mode: 'paper', theme, hash: 'exhibitors', width: 390, height: 844, reducedMotion: true });
    await page.locator('#paper-main').getByRole('radio', { name: 'Floor map' }).click();
    await shot(page, `states/${theme}/exhibitors-map-390.png`);
    await page.locator('#paper-main').locator('[data-booth="A1"]').click();
    await shot(page, `states/${theme}/exhibitors-assign-390.png`);
  });
}
