import { test, expect, type Page } from '@playwright/test';
import { boot } from '../helpers';

async function startAndPause(page: Page) {
  await page.locator('[data-pill]').click();
  await page.waitForFunction(() => window.__rf.transition !== null);
  await page.evaluate(() => window.__rf.transition!.pause());
}
const opacityOf = (page: Page, name: string) =>
  page.evaluate((n) => Number(getComputedStyle(document.querySelector(`[data-layer="${n}"]`)!).opacity), name);

async function expectCleanFinal(page: Page, layer: 'faithful' | 'paper') {
  await expect(page.locator('[data-transitioning]')).toHaveCount(0, { timeout: 5000 });
  const other = layer === 'paper' ? 'faithful' : 'paper';
  await expect(page.locator(`[data-layer="${other}"]`)).toHaveCount(0);
  const state = await page.evaluate((n) => {
    const el = document.querySelector<HTMLElement>(`[data-layer="${n}"]`)!;
    return { style: el.getAttribute('style'), willChange: getComputedStyle(el).willChange, card: el.classList.contains('is-card'), transform: getComputedStyle(el).transform };
  }, layer);
  expect(state.style ?? '').toBe('');
  expect(state.willChange).toBe('auto');
  expect(state.card).toBe(false);
  expect(state.transform).toBe('none');
}

for (const width of [1447, 390]) {
  test.describe(`mode transition at ${width}`, () => {
    test('into Brandon\'s Mode: neither page is solid mid-way, then a clean final state', async ({ page }) => {
      await boot(page, { width, height: width > 900 ? 1024 : 844 });
      await startAndPause(page);
      await page.evaluate(() => window.__rf.transition!.seek(0.65));
      const out = await opacityOf(page, 'faithful');
      const inc = await opacityOf(page, 'paper');
      expect(out).toBeGreaterThan(0.15);
      expect(out).toBeLessThan(0.45);
      expect(inc).toBeGreaterThan(0.45);
      expect(inc).toBeLessThan(0.85);
      await expect(page.locator('[data-layer="faithful"]')).toHaveClass(/is-card/);
      await page.evaluate(() => window.__rf.transition!.play());
      await expectCleanFinal(page, 'paper');
    });

    test('back to the original: same choreography in reverse, scrolled to top', async ({ page }) => {
      await boot(page, { width, height: width > 900 ? 1024 : 844, mode: 'paper' });
      await startAndPause(page);
      await page.evaluate(() => window.__rf.transition!.seek(0.65));
      expect(await opacityOf(page, 'paper')).toBeLessThan(0.45);
      expect(await opacityOf(page, 'faithful')).toBeGreaterThan(0.45);
      await page.evaluate(() => window.__rf.transition!.play());
      await expectCleanFinal(page, 'faithful');
      expect(await page.evaluate(() => document.querySelector('[data-layer="faithful"]')!.scrollTop)).toBe(0);
    });
  });
}
