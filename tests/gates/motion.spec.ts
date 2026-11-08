// Motion gate (docs/19-testing.md). Real time on purpose: this gate measures timing, so it does not
// install the fake clock (decision D-8).
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve('tests/gates/__out__');

async function open(page: Page, width: number, height: number, mode: 'faithful' | 'paper' = 'faithful') {
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  if (mode === 'paper') {
    await page.evaluate(() => window.__rf.setMode('paper', { instant: true }));
    await expect(page.locator('[data-layer="paper"]')).toBeVisible();
  }
  await page.waitForTimeout(1900);
}

function record(name: string, value: unknown) {
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}/motion-results.json`;
  const all = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  all[name] = value;
  writeFileSync(file, JSON.stringify(all, null, 2));
}

async function timedRun(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __longTasks: number[]; __t: { click?: number; end?: number } };
    w.__longTasks = [];
    w.__t = {};
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__longTasks.push(e.duration);
    }).observe({ type: 'longtask', buffered: false });
    const stage = document.querySelector('[data-layer]')!.parentElement!;
    new MutationObserver(() => {
      if (stage.hasAttribute('data-transitioning')) return;
      if (w.__t.click && !w.__t.end) w.__t.end = performance.now();
    }).observe(stage, { attributes: true, attributeFilter: ['data-transitioning'] });
    document.querySelector('[data-pill]')!.addEventListener('click', () => (w.__t.click = performance.now()), { capture: true, once: true });
  });
  await page.locator('[data-pill]').click();
  await page.waitForFunction(() => (window as unknown as { __t: { end?: number } }).__t.end !== undefined, null, { timeout: 5000 });
  return page.evaluate(() => {
    const w = window as unknown as { __longTasks: number[]; __t: { click: number; end: number } };
    return { duration: w.__t.end - w.__t.click, longest: Math.max(0, ...w.__longTasks) };
  });
}

async function finalChecks(page: Page, landed: 'faithful' | 'paper') {
  const gone = landed === 'paper' ? 'faithful' : 'paper';
  await expect(page.locator(`[data-layer="${gone}"]`)).toHaveCount(0);
  const s = await page.evaluate((n) => {
    const el = document.querySelector<HTMLElement>(`[data-layer="${n}"]`)!;
    return { willChange: getComputedStyle(el).willChange, inline: el.style.transform };
  }, landed);
  expect(s.willChange).toBe('auto');
  expect(s.inline).toBe('');
  const pill = page.locator('[data-pill]');
  await expect(pill).toHaveAttribute('aria-pressed', landed === 'paper' ? 'true' : 'false');
  await expect(pill).toHaveAccessibleName(landed === 'paper' ? 'View original' : "Brandon's Mode");
}

for (const [width, height] of [
  [1447, 1024],
  [390, 844],
] as const) {
  test.describe(`motion gate ${width}`, () => {
    test('into Brandon\'s Mode: no long task over 100 ms, done within 2.4 s', async ({ page }) => {
      await open(page, width, height);
      const r = await timedRun(page);
      record(`in-${width}`, r);
      console.log(`motion in ${width}: ${r.duration.toFixed(0)} ms, longest task ${r.longest.toFixed(0)} ms`);
      expect(r.longest).toBeLessThanOrEqual(100);
      expect(r.duration).toBeLessThan(2400);
      await finalChecks(page, 'paper');
    });

    test('back to the original: same limits', async ({ page }) => {
      await open(page, width, height, 'paper');
      const r = await timedRun(page);
      record(`out-${width}`, r);
      console.log(`motion out ${width}: ${r.duration.toFixed(0)} ms, longest task ${r.longest.toFixed(0)} ms`);
      expect(r.longest).toBeLessThanOrEqual(100);
      expect(r.duration).toBeLessThan(2400);
      await finalChecks(page, 'faithful');
    });

    test('seek: neither page is solid at 650 ms', async ({ page }) => {
      await open(page, width, height);
      await page.locator('[data-pill]').click();
      await page.waitForFunction(() => window.__rf.transition !== null);
      await page.evaluate(() => window.__rf.transition!.pause());
      mkdirSync(OUT, { recursive: true });
      for (const t of [0.3, 1.0]) {
        await page.evaluate((s) => window.__rf.transition!.seek(s), t);
        await page.screenshot({ path: `${OUT}/motion-${width}-${t * 1000}.png` });
      }
      await page.evaluate(() => window.__rf.transition!.seek(0.65));
      const [out, inc] = await page.evaluate(() =>
        ['faithful', 'paper'].map((n) => Number(getComputedStyle(document.querySelector(`[data-layer="${n}"]`)!).opacity)),
      );
      record(`seek-${width}`, { outgoing: out, incoming: inc });
      expect(out).toBeGreaterThanOrEqual(0.15);
      expect(out).toBeLessThanOrEqual(0.45);
      expect(inc).toBeGreaterThanOrEqual(0.45);
      expect(inc).toBeLessThanOrEqual(0.85);
      await page.evaluate(() => window.__rf.transition!.play());
      await expect(page.locator('[data-transitioning]')).toHaveCount(0, { timeout: 5000 });
      await finalChecks(page, 'paper');
    });
  });
}

test('reduced motion: a crossfade within 500 ms and no transforms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 1447, 1024);
  await page.evaluate(() => {
    const w = window as unknown as { __sawTransform: boolean };
    w.__sawTransform = false;
    const check = () => {
      for (const el of document.querySelectorAll<HTMLElement>('[data-layer]')) if (el.style.transform && el.style.transform !== 'none') w.__sawTransform = true;
      if (document.querySelector('[data-transitioning]') || !w.__sawTransform) requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
  const r = await timedRun(page);
  record('reduced', r);
  expect(r.duration).toBeLessThan(500);
  expect(await page.evaluate(() => (window as unknown as { __sawTransform: boolean }).__sawTransform)).toBe(false);
  await finalChecks(page, 'paper');
});
