import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const FILE = pathToFileURL(resolve(process.env.BUILD_HTML ?? 'build/index.html')).href;

test('build opens over file:// and renders', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`));
  await page.goto(FILE);
  await expect(page).toHaveTitle('RainFocus Summit · Claude');
  await expect(page.getByRole('heading', { name: 'RainFocus Summit' }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
