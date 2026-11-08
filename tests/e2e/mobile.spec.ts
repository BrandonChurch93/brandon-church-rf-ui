// Mobile pass (docs/17, docs/18 "Touch and pointer"): 44 px targets on touch layouts, no horizontal
// page scroll at any test width, the landscape phone layout, and sheet focus on touch.
import { test, expect, type Page } from '@playwright/test';
import { boot, hasHorizontalOverflow } from '../helpers';

const VIEWS = ['guide', 'attendees', 'attendee-types', 'packages', 'reg-codes', 'discounts', 'content', 'exhibitors'] as const;
const WIDTHS = [1920, 1447, 1200, 1199, 1024, 900, 899, 768, 600, 599, 414, 390, 375, 320];

/**
 * Every visible interactive element in Brandon's Mode (layer and portals) whose hit area is under
 * 44 x 44. The hit area is the element's box, grown by an absolutely positioned ::before or ::after
 * (the touch-target mixin and stretched card buttons) or by a wrapping label.
 */
async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const SEL = 'button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="radio"], [role="checkbox"], [role="switch"], [role="menuitem"], [role="option"], [role="link"], [tabindex="0"]';
    const roots = [document.querySelector('[data-layer="paper"]'), ...document.querySelectorAll('[data-paper-root]')].filter(Boolean) as Element[];
    const seen = new Set<Element>();
    const out: string[] = [];
    for (const root of roots)
      for (const el of root.querySelectorAll<HTMLElement>(SEL)) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (el.closest('[hidden], [inert], [aria-hidden="true"]')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Off-screen content (a horizontally scrolled strip, an offscreen skip link) is measured where it shows.
        if (r.right <= 0 || r.left >= innerWidth || r.bottom <= 0 || r.top >= innerHeight) continue;
        let w = r.width;
        let h = r.height;
        for (const pseudo of ['::after', '::before']) {
          const ps = getComputedStyle(el, pseudo);
          if (ps.content === 'none' || ps.position !== 'absolute') continue;
          w = Math.max(w, parseFloat(ps.width) || 0);
          h = Math.max(h, parseFloat(ps.height) || 0);
        }
        const label = el.closest('label');
        if (label) {
          const lr = label.getBoundingClientRect();
          w = Math.max(w, lr.width);
          h = Math.max(h, lr.height);
        }
        if (w < 43.5 || h < 43.5) {
          const name = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || el.getAttribute('placeholder') || el.tagName;
          out.push(`${Math.round(w)}x${Math.round(h)} ${el.tagName.toLowerCase()} "${name}"`);
        }
      }
    return out;
  });
}

async function go(page: Page, hash: string) {
  await page.evaluate((h) => (window.location.hash = h), hash);
  await expect(page.locator('#view-title')).toBeVisible();
  await page.waitForTimeout(500);
}

test.describe('mobile · touch targets', () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const width of [390, 320]) {
    test(`every view at rest · ${width}`, async ({ page }) => {
      await boot(page, { mode: 'paper', hash: 'guide', width, height: 844, reducedMotion: true });
      for (const v of VIEWS) {
        await go(page, v);
        expect(await smallTargets(page), `${v} at ${width}`).toEqual([]);
      }
    });
  }

  test('sheets, menus and pickers · 390', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'guide', width: 390, height: 844, reducedMotion: true });
    const main = page.locator('#paper-main');
    const states: Array<[string, string, () => Promise<void>]> = [
      ['guide', 'palette', () => page.getByRole('button', { name: /^Search/ }).first().click()],
      ['guide', 'drawer', () => page.getByRole('button', { name: 'Open navigation' }).click()],
      ['guide', 'account menu', () => page.getByRole('button', { name: /Account/ }).first().click()],
      ['guide', 'general sheet', () => main.getByRole('button', { name: /^General/ }).first().click()],
      ['guide', 'template picker', () => main.getByRole('button', { name: /Add registration workflow/ }).first().click()],
      ['attendees', 'detail', () => main.locator('[data-flip-id] button').first().click()],
      ['attendees', 'filters', () => main.getByRole('button', { name: /^Filters/ }).first().click()],
      ['attendees', 'add', () => main.getByRole('button', { name: /Add attendee/ }).first().click()],
      ['attendee-types', 'editor', () => main.getByRole('button', { name: /^Speaker/ }).first().click()],
      ['packages', 'editor', () => main.getByRole('button', { name: /^Full Conference,/ }).first().click()],
      ['reg-codes', 'editor', () => main.getByRole('button', { name: /^RF-SPKR-2026,/ }).first().click()],
      ['reg-codes', 'row menu', () => main.getByRole('button', { name: /More actions/ }).first().click()],
      ['discounts', 'editor', () => main.getByRole('button', { name: /^Early bird\./ }).first().click()],
      ['content', 'session', () => main.getByRole('button', { name: /Opening keynote/ }).first().click()],
      ['content', 'tracks', () => main.getByRole('button', { name: /Tracks/ }).first().click()],
      ['exhibitors', 'detail', () => main.getByRole('button', { name: /^Lumen AV,/ }).first().click()],
      ['exhibitors', 'add', () => main.getByRole('button', { name: 'Add exhibitor' }).first().click()],
      ['exhibitors', 'card menu', () => main.getByRole('button', { name: 'More actions for Lumen AV' }).click()],
      [
        'exhibitors',
        'assign',
        async () => {
          await main.getByRole('radio', { name: 'Floor map' }).click();
          await main.locator('[data-booth="A1"]').click();
        },
      ],
    ];
    for (const [view, label, open] of states) {
      await go(page, view === 'guide' ? 'attendees' : 'guide');
      await go(page, view);
      await open();
      const ready = view === 'attendee-types' ? main.getByRole('textbox', { name: /^Name/ }) : page.getByRole('dialog').or(page.getByRole('menu')).first();
      await expect(ready).toBeVisible();
      await page.waitForTimeout(400);
      expect(await smallTargets(page), `${view} · ${label}`).toEqual([]);
      for (let i = 0; i < 3 && (await page.getByRole('dialog').or(page.getByRole('menu')).count()); i++) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(250);
      }
    }
  });
});

test.describe('mobile · layout', () => {
  test('no horizontal page scroll in any view at any test width', async ({ page }) => {
    test.setTimeout(120_000);
    await boot(page, { mode: 'paper', hash: 'guide', reducedMotion: true });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width > 900 ? 1024 : 844 });
      for (const v of VIEWS) {
        await go(page, v);
        expect(await hasHorizontalOverflow(page, 'paper'), `${v} at ${width}`).toBe(false);
      }
    }
  });

  test('landscape phone 844 x 390: bars fit and the body scrolls between them', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendees', width: 844, height: 390, reducedMotion: true });
    const top = await page.getByRole('banner').boundingBox();
    const tabs = await page.locator('nav[data-tabbar]').boundingBox();
    expect(top && tabs).toBeTruthy();
    expect(top!.y).toBeGreaterThanOrEqual(0);
    expect(tabs!.y + tabs!.height).toBeLessThanOrEqual(390 + 1);
    expect(tabs!.y - (top!.y + top!.height)).toBeGreaterThan(150);
    for (const v of VIEWS) {
      await go(page, v);
      expect(await hasHorizontalOverflow(page, 'paper'), v).toBe(false);
    }
    const layer = page.locator('[data-layer="paper"]');
    const before = await layer.evaluate((el) => el.scrollTop);
    await layer.evaluate((el) => el.scrollBy(0, 400));
    expect(await layer.evaluate((el) => el.scrollTop)).toBeGreaterThan(before);
  });
});

test.describe('mobile · sheets focus', () => {
  test('desktop: a new-item sheet focuses its first field', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors' });
    await page.locator('#paper-main').getByRole('button', { name: 'Add exhibitor' }).first().click();
    await expect(page.getByRole('dialog', { name: 'New exhibitor' }).getByRole('textbox', { name: /^Company name/ })).toBeFocused();
    await expect(page.getByText('Enter a company name')).toHaveCount(0);
  });

  test('touch: the sheet keeps focus on itself, so the keyboard does not cover it', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'exhibitors', width: 390, height: 844 });
    await page.locator('#paper-main').getByRole('button', { name: 'Add exhibitor' }).first().click();
    const sheet = page.getByRole('dialog', { name: 'New exhibitor' });
    await expect(sheet).toBeFocused();
    await expect(page.getByText('Enter a company name')).toHaveCount(0);
    const box = await sheet.boundingBox();
    expect(box!.y).toBeGreaterThan(0);
  });
});
