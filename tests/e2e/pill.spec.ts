import { test, expect } from '@playwright/test';
import { boot } from '../helpers';

const pill = (page: import('@playwright/test').Page) => page.locator('[data-pill]');
const waitIdle = (page: import('@playwright/test').Page) =>
  expect(page.locator('[data-transitioning]')).toHaveCount(0, { timeout: 5000 });

test.describe('the pill', () => {
  test('enters from below within two seconds', async ({ page }) => {
    await boot(page);
    await page.waitForTimeout(2000);
    await expect(pill(page)).toBeInViewport({ ratio: 1 });
    const opacity = await page.evaluate(() => getComputedStyle(document.querySelector('[data-pill]')!.parentElement!).opacity);
    expect(Number(opacity)).toBe(1);
    await expect(pill(page)).toHaveAccessibleName("Brandon's Mode");
    await expect(pill(page)).toHaveAccessibleDescription("Switches between the original design and Brandon's Mode");
  });

  test('flips its label and aria-pressed, and a second click returns', async ({ page }) => {
    await boot(page);
    await expect(pill(page)).toHaveAttribute('aria-pressed', 'false');
    await pill(page).click();
    await expect(pill(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(pill(page)).toHaveAccessibleName('View original');
    await waitIdle(page);
    await expect(page.locator('[data-layer="paper"]')).toBeVisible();
    await expect(page.locator('[data-layer="faithful"]')).toHaveCount(0);
    await pill(page).click();
    await expect(pill(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(pill(page)).toHaveAccessibleName("Brandon's Mode");
    await waitIdle(page);
    await expect(page.locator('[data-layer="faithful"]')).toBeVisible();
    await expect(page.locator('[data-layer="paper"]')).toHaveCount(0);
  });

  test('ignores clicks while a transition runs', async ({ page }) => {
    await boot(page);
    await pill(page).click();
    await expect(page.locator('[data-transitioning]')).toHaveCount(1);
    await pill(page).click({ force: true });
    await pill(page).click({ force: true });
    await waitIdle(page);
    await expect(pill(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-layer="paper"]')).toBeVisible();
  });

  test('works from the keyboard', async ({ page }) => {
    await boot(page);
    await pill(page).focus();
    await page.keyboard.press('Enter');
    await expect(pill(page)).toHaveAttribute('aria-pressed', 'true');
    await waitIdle(page);
    await page.keyboard.press('Space');
    await expect(pill(page)).toHaveAttribute('aria-pressed', 'false');
    await waitIdle(page);
    await expect(page.locator('[data-layer="faithful"]')).toBeVisible();
  });

  test('reduced motion: at rest immediately and a quick crossfade', async ({ page }) => {
    await boot(page, { reducedMotion: true });
    await expect(pill(page)).toBeInViewport({ ratio: 1 });
    const start = Date.now();
    await pill(page).click();
    await waitIdle(page);
    expect(Date.now() - start).toBeLessThan(1500);
    await expect(page.locator('[data-layer="paper"]')).toBeVisible();
  });

  test('sits bottom right and moves above the tab bar area in Brandon\'s Mode on mobile', async ({ page }) => {
    await boot(page, { width: 390, height: 844, reducedMotion: true });
    const before = await pill(page).boundingBox();
    expect(before!.x + before!.width).toBeCloseTo(390 - 16, 0);
    expect(before!.y + before!.height).toBeCloseTo(844 - 16, 0);
    await pill(page).click();
    await waitIdle(page);
    const after = await pill(page).boundingBox();
    expect(after!.y + after!.height).toBeCloseTo(844 - 16 - 64, 0);
  });
});

test('GSAP tweens advance under the installed clock', async ({ page }) => {
  await boot(page);
  const moved = await page.evaluate(async () => {
    const el = document.querySelector<HTMLElement>('[data-pill]')!.parentElement!;
    const before = getComputedStyle(el).transform;
    await new Promise((r) => setTimeout(r, 1500));
    return before !== getComputedStyle(el).transform || getComputedStyle(el).opacity === '1';
  });
  expect(moved).toBe(true);
});

for (const [w, h] of [
  [1447, 1024],
  [390, 844],
] as const) {
  test(`steps aside fully while a layer is open (${w})`, async ({ page }) => {
    await boot(page, { mode: 'paper', width: w, height: h, reducedMotion: true });
    if (w > 900) await page.getByRole('button', { name: 'About this build' }).click();
    else await page.getByRole('button', { name: 'FL, Account' }).click();
    await expect.poll(async () => (await page.locator('[data-pill]').boundingBox())!.y).toBeGreaterThanOrEqual(h);
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await page.locator('[data-pill]').boundingBox())!.y).toBeLessThan(h);
  });
}
