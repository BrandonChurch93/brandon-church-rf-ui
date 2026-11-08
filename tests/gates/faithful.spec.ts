// Faithful pixel gate (docs/19-testing.md). Compares the app's faithful mode with reference/faithful
// in the same Chromium, masks the pill, and requires a pixelmatch mismatch under the thresholds.
import { test, expect, type Page } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT = resolve('tests/gates/__out__');
const REFERENCE = pathToFileURL(resolve('reference/faithful/index.html')).href;
const PILL_MASK_PAD = 48;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function referenceHeight(page: Page, width: number) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(REFERENCE);
  await settle(page);
  return page.evaluate(() => document.documentElement.scrollHeight);
}

async function shootReference(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto(REFERENCE);
  await settle(page);
  return page.screenshot();
}

async function shootApp(page: Page, width: number, height: number, dark = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width, height });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  if (dark) await page.evaluate(() => window.__rf.setTheme('dark'));
  await settle(page);
  const pill = page.locator('[data-pill]');
  const box: Box | null = (await pill.count()) ? await pill.boundingBox() : null;
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  return { png: await page.screenshot(), pill: box, theme };
}

function maskBox(img: PNG, box: Box | null) {
  if (!box) return;
  const x0 = Math.max(0, Math.floor(box.x - PILL_MASK_PAD));
  const y0 = Math.max(0, Math.floor(box.y - PILL_MASK_PAD));
  const x1 = Math.min(img.width, Math.ceil(box.x + box.width + PILL_MASK_PAD));
  const y1 = Math.min(img.height, Math.ceil(box.y + box.height + PILL_MASK_PAD));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * img.width + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = img.data[i + 3] = 255;
    }
  }
}

function compare(name: string, appBuf: Buffer, refBuf: Buffer, pill: Box | null) {
  const app = PNG.sync.read(appBuf);
  const ref = PNG.sync.read(refBuf);
  expect(app.width).toBe(ref.width);
  expect(app.height).toBe(ref.height);
  maskBox(app, pill);
  maskBox(ref, pill);
  const { width, height } = app;
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(app.data, ref.data, diff.data, width, height, { threshold: 0.1, includeAA: false });
  const overlay = new PNG({ width, height });
  for (let i = 0; i < app.data.length; i++) overlay.data[i] = Math.round((app.data[i] + ref.data[i]) / 2);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/faithful-diff-${name}.png`, PNG.sync.write(diff));
  writeFileSync(`${OUT}/faithful-overlay-${name}.png`, PNG.sync.write(overlay));
  const pct = (mismatched / (width * height)) * 100;
  const resultsFile = `${OUT}/faithful-results.json`;
  const results = existsSync(resultsFile) ? JSON.parse(readFileSync(resultsFile, 'utf8')) : {};
  results[name] = Number(pct.toFixed(4));
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  return pct;
}

test.describe('faithful pixel gate', () => {
  test.describe.configure({ mode: 'serial' });

  test('1447 x 1024 under 1.0%', async ({ page }) => {
    const ref = await shootReference(page, 1447, 1024);
    const app = await shootApp(page, 1447, 1024);
    const pct = compare('1447', app.png, ref, app.pill);
    console.log(`faithful 1447: ${pct.toFixed(3)}%`);
    expect(pct).toBeLessThan(1.0);
  });

  for (const width of [1024, 768, 390, 320]) {
    test(`${width} at full reference height under 2.0%`, async ({ page }) => {
      const height = await referenceHeight(page, width);
      const ref = await shootReference(page, width, height);
      const app = await shootApp(page, width, height);
      const pct = compare(String(width), app.png, ref, app.pill);
      console.log(`faithful ${width} x ${height}: ${pct.toFixed(3)}%`);
      expect(pct).toBeLessThan(2.0);
    });
  }

  test('1447 with the dark theme set is unchanged', async ({ page }) => {
    const ref = await shootReference(page, 1447, 1024);
    const app = await shootApp(page, 1447, 1024, true);
    expect(app.theme).toBe('dark');
    const pct = compare('1447-dark', app.png, ref, app.pill);
    console.log(`faithful 1447 dark: ${pct.toFixed(3)}%`);
    expect(pct).toBeLessThan(1.0);
  });
});
