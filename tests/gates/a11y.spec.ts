// A11y gate (docs/18-accessibility.md): zero serious or critical axe violations.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { boot } from '../helpers';

const OUT = resolve('tests/gates/__out__');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page: Page, name: string, opts: { disable?: string[] } = {}) {
  // Let any enter fade finish so contrast is measured on settled colors.
  await page.waitForTimeout(350);
  // Controls that sit partly under the fixed mobile tab bar at this scroll position are skipped:
  // axe measures their visible sliver as the target size. The same components are audited where
  // they are fully on screen (D-24).
  await page.evaluate(() => {
    document.querySelectorAll('[data-axe-under-chrome]').forEach((el) => el.removeAttribute('data-axe-under-chrome'));
    const bar = document.querySelector('nav[data-tabbar]')?.getBoundingClientRect();
    if (!bar || bar.height === 0) return;
    document.querySelectorAll('[data-layer="paper"] main button, [data-layer="paper"] main a, [data-layer="paper"] main [role="button"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > bar.top && r.top < bar.top) el.setAttribute('data-axe-under-chrome', '');
    });
  });
  let builder = new AxeBuilder({ page }).withTags(TAGS).exclude('[data-axe-under-chrome]');
  if (opts.disable?.length) builder = builder.disableRules(opts.disable);
  const results = await builder.analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const moderate = results.violations.filter((v) => v.impact === 'moderate' || v.impact === 'minor');
  // Each audit writes its own file (atomically, via rename), and the merged report is rebuilt from
  // the directory: parallel workers never read a half-written file or overwrite each other.
  const entry = {
    blocking: blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 8) })),
    moderate: moderate.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 8) })),
  };
  const dir = `${OUT}/a11y`;
  mkdirSync(dir, { recursive: true });
  const tmp = `${dir}/.${name}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(entry, null, 2));
  renameSync(tmp, `${dir}/${name}.json`);
  const report: Record<string, unknown> = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) report[f.slice(0, -5)] = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const merged = `${OUT}/.a11y.${process.pid}.tmp`;
  writeFileSync(merged, JSON.stringify(report, null, 2));
  renameSync(merged, `${OUT}/a11y.json`);
  expect(blocking, `${name}: ${JSON.stringify(entry.blocking, null, 2)}`).toEqual([]);
}

test.describe('a11y gate · faithful mode', () => {
  // The design's own #777777 labels sit below AA on white; faithful mode reproduces them (decision D-6).
  const faithfulOpts = { disable: ['color-contrast'] };

  test('faithful 1447', async ({ page }) => {
    await boot(page, { width: 1447, height: 1024 });
    await audit(page, 'faithful-1447', faithfulOpts);
  });

  test('faithful 390', async ({ page }) => {
    await boot(page, { width: 390, height: 844 });
    await audit(page, 'faithful-390', faithfulOpts);
  });

  test('faithful 390 with the drawer open', async ({ page }) => {
    await boot(page, { width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await audit(page, 'faithful-390-drawer', faithfulOpts);
  });
});

const VIEWS = ['guide', 'attendees', 'attendee-types', 'packages', 'reg-codes', 'discounts', 'content', 'exhibitors'];

test.describe('a11y gate · Brandon\'s Mode views', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1447, 390]) {
      test(`all views · ${theme} · ${width}`, async ({ page }) => {
        await boot(page, { mode: 'paper', theme, width, height: width > 900 ? 1024 : 844, reducedMotion: true });
        for (const view of VIEWS) {
          await page.evaluate((v) => (window.location.hash = v), view);
          await expect(page.locator('#view-title')).toBeVisible();
          await page.waitForTimeout(700);
          await audit(page, `paper-${view}-${theme}-${width}`);
        }
      });
    }
  }
});

test.describe('a11y gate · layers', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`palette, account menu, confirm · ${theme}`, async ({ page }) => {
      await boot(page, { mode: 'paper', theme, reducedMotion: true });
      await page.keyboard.press('ControlOrMeta+k');
      await page.keyboard.type('a');
      await audit(page, `palette-${theme}`);
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'FL, Account' }).first().click();
      await audit(page, `account-${theme}`);
      await page.getByRole('button', { name: 'Reset demo data' }).click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await audit(page, `confirm-${theme}`);
    });

    test(`drawer and about · ${theme} · 390`, async ({ page }) => {
      await boot(page, { mode: 'paper', theme, width: 390, height: 844, reducedMotion: true });
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await audit(page, `drawer-${theme}`);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Shift+?');
      await expect(page.getByRole('dialog', { name: 'About this build' })).toBeVisible();
      await audit(page, `about-${theme}`);
    });
  }
});

test.describe('a11y gate · guide layers', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`setting sheet, template picker, workflow editor, portal · ${theme}`, async ({ page }) => {
      await boot(page, { mode: 'paper', theme, reducedMotion: true });
      const main = page.locator('#paper-main');
      await main.getByRole('button', { name: /^Attendee attributes/ }).click();
      await audit(page, `guide-attributes-${theme}`);
      await page.keyboard.press('Escape');
      await main.getByRole('button', { name: 'Add registration workflow' }).click();
      await audit(page, `guide-picker-${theme}`);
      await page.keyboard.press('Escape');
      await main.getByRole('button', { name: /^Attendee Registration, Live/ }).click();
      await audit(page, `guide-editor-${theme}`);
      await page.keyboard.press('Escape');
      await main.getByRole('button', { name: /^Attendee Portal/ }).click();
      await audit(page, `guide-portal-${theme}`);
    });
  }
});

test.describe('a11y gate · attendees layers', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`detail sheet, selection, remove confirm · ${theme}`, async ({ page }) => {
      await boot(page, { mode: 'paper', theme, hash: 'attendees', reducedMotion: true });
      const main = page.locator('#paper-main');
      await main.locator('tbody tr[data-flip-id]').first().locator('td').nth(4).click();
      await audit(page, `attendee-detail-${theme}`);
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      await audit(page, `attendee-detail-edit-${theme}`);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await main.locator('tbody tr[data-flip-id]').nth(1).getByRole('checkbox').check();
      await audit(page, `attendee-bulk-${theme}`);
      await main.getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: 'Remove' }).click();
      await audit(page, `attendee-confirm-${theme}`);
    });
  }
});

test.describe('a11y gate · P7 editors', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`types, packages, codes, discounts editors · ${theme}`, async ({ page }) => {
      await boot(page, { mode: 'paper', theme, hash: 'attendee-types', reducedMotion: true });
      const main = page.locator('#paper-main');
      await main.getByRole('button', { name: /^Speaker\./ }).click();
      await audit(page, `types-editor-${theme}`);
      await page.keyboard.press('Escape');
      await page.evaluate(() => (window.location.hash = 'packages'));
      await main.getByRole('button', { name: /^Full Conference,/ }).click();
      await audit(page, `package-editor-${theme}`);
      await page.keyboard.press('Escape');
      await page.evaluate(() => (window.location.hash = 'reg-codes'));
      await main.getByRole('button', { name: 'Generate code' }).click();
      await audit(page, `code-editor-${theme}`);
      await page.keyboard.press('Escape');
      await main.getByRole('button', { name: 'Bulk generate' }).click();
      await audit(page, `bulk-generate-${theme}`);
      await page.keyboard.press('Escape');
      await page.evaluate(() => (window.location.hash = 'discounts'));
      await main.getByRole('button', { name: /^Early bird\./ }).click();
      await audit(page, `discount-editor-${theme}`);
    });
  }
});

test.describe('a11y gate · content', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`grid, list, session sheet, tracks · ${theme}`, async ({ page }) => {
      await boot(page, { mode: 'paper', theme, hash: 'content', reducedMotion: true });
      const main = page.locator('#paper-main');
      await main.locator('[data-block]').first().click();
      await audit(page, `session-sheet-${theme}`);
      await page.keyboard.press('Escape');
      await main.getByRole('button', { name: 'Manage tracks' }).click();
      await audit(page, `manage-tracks-${theme}`);
      await page.keyboard.press('Escape');
      await main.getByRole('radio', { name: 'List' }).click();
      await audit(page, `content-list-${theme}`);
    });
  }
});

test.describe('a11y gate · exhibitors', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`cards, map, assign, detail, add · ${theme}`, async ({ page }) => {
      await boot(page, { mode: 'paper', theme, hash: 'exhibitors', reducedMotion: true });
      const main = page.locator('#paper-main');
      await main.getByRole('radio', { name: 'Floor map' }).click();
      await audit(page, `exhibitors-map-${theme}`);
      await main.locator('[data-booth="C6"]').click();
      await audit(page, `exhibitors-assign-${theme}`);
      await page.keyboard.press('Escape');
      await main.locator('[data-booth="D2"]').click();
      await audit(page, `exhibitor-detail-${theme}`);
      await page.getByRole('dialog', { name: 'Lumen AV' }).getByRole('button', { name: 'Edit details' }).click();
      await audit(page, `exhibitor-detail-edit-${theme}`);
      await page.getByRole('dialog', { name: 'Lumen AV' }).getByRole('button', { name: 'Cancel' }).click();
      await page.keyboard.press('Escape');
      await main.getByRole('button', { name: 'Add exhibitor' }).first().click();
      await page.getByRole('dialog', { name: 'New exhibitor' }).getByRole('button', { name: 'Add exhibitor' }).click();
      await audit(page, `exhibitor-add-errors-${theme}`);
    });
  }
});
