import type { Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const CAPTURES = resolve('tests/visual/__captures__');

/** Full-page capture: the document never scrolls, so the viewport grows to the active layer's height. */
export async function capture(page: Page, rel: string, opts: { full?: boolean; minHeight?: number } = {}) {
  const file = resolve(CAPTURES, rel);
  mkdirSync(dirname(file), { recursive: true });
  const vp = page.viewportSize()!;
  if (opts.full !== false) {
    const h = await page.evaluate(() => {
      const layer = document.querySelector<HTMLElement>('[data-layer="paper"]') ?? document.querySelector<HTMLElement>('[data-layer="faithful"]');
      return layer?.scrollHeight ?? document.documentElement.scrollHeight;
    });
    await page.setViewportSize({ width: vp.width, height: Math.max(opts.minHeight ?? 900, h) });
    await page.waitForTimeout(250);
  }
  await page.screenshot({ path: file });
  if (opts.full !== false) await page.setViewportSize(vp);
}

export async function settle(page: Page, ms = 700) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}
