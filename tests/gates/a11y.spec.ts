// A11y gate (docs/18-accessibility.md): zero serious or critical axe violations.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { boot } from '../helpers';

const OUT = resolve('tests/gates/__out__');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page: Page, name: string, opts: { disable?: string[] } = {}) {
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (opts.disable?.length) builder = builder.disableRules(opts.disable);
  const results = await builder.analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const moderate = results.violations.filter((v) => v.impact === 'moderate' || v.impact === 'minor');
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}/a11y.json`;
  const report = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  report[name] = {
    blocking: blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 8) })),
    moderate: moderate.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 8) })),
  };
  writeFileSync(file, JSON.stringify(report, null, 2));
  expect(blocking, `${name}: ${JSON.stringify(report[name].blocking, null, 2)}`).toEqual([]);
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
