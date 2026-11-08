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
