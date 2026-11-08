import { expect, type Page } from '@playwright/test';

export const SEED_NOW = new Date('2026-11-07T18:00:00Z');

export interface BootOptions {
  mode?: 'faithful' | 'paper';
  hash?: string;
  width?: number;
  height?: number;
  reducedMotion?: boolean;
  theme?: 'light' | 'dark';
  keepStorage?: boolean;
}

/** Opens the app with a fixed clock, a fresh seed and (optionally) Brandon's Mode already on. */
export async function boot(page: Page, opts: BootOptions = {}) {
  if (opts.width) await page.setViewportSize({ width: opts.width, height: opts.height ?? 900 });
  await page.clock.install({ time: SEED_NOW });
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  if (!opts.keepStorage) {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('__rf_cleared')) {
        localStorage.clear();
        sessionStorage.setItem('__rf_cleared', '1');
      }
    });
  }
  await page.goto('/' + (opts.hash ? `#${opts.hash}` : ''));
  await page.evaluate(() => document.fonts.ready);
  if (opts.theme) await page.evaluate((t) => window.__rf.setTheme(t), opts.theme);
  if (opts.mode === 'paper') {
    await page.evaluate(() => window.__rf.setMode('paper', { instant: true }));
    await expect(page.locator('[data-layer="paper"]')).toBeVisible();
    await expect(page.locator('[data-layer="faithful"]')).toHaveCount(0);
  }
}

export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** True when the given layer (or the document) scrolls horizontally. */
export async function hasHorizontalOverflow(page: Page, layer: 'faithful' | 'paper') {
  return page.evaluate((name) => {
    const el = document.querySelector<HTMLElement>(`[data-layer="${name}"]`);
    const doc = document.documentElement;
    const layerOverflow = el ? el.scrollWidth > el.clientWidth + 1 : false;
    return layerOverflow || doc.scrollWidth > doc.clientWidth + 1;
  }, layer);
}
