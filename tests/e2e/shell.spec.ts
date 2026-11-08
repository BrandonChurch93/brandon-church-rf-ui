import { test, expect, type Page } from '@playwright/test';
import { boot } from '../helpers';

const paper = (page: Page) => page.locator('[data-layer="paper"]');
const sidebarNav = (page: Page) => page.getByRole('navigation', { name: 'Event navigation' });
const h1 = (page: Page) => paper(page).getByRole('heading', { level: 1 });

test.describe('shell · desktop', () => {
  test('nav routes, hash sync, back and forward, active item', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await expect(page).toHaveURL(/#guide$/);
    await sidebarNav(page).getByRole('link', { name: 'Packages' }).click();
    await expect(page).toHaveURL(/#packages$/);
    await expect(h1(page)).toHaveText('Packages');
    await expect(sidebarNav(page).getByRole('link', { name: 'Packages' })).toHaveAttribute('aria-current', 'page');
    await sidebarNav(page).getByRole('link', { name: 'Content' }).click();
    await expect(h1(page)).toHaveText('Content');
    await page.goBack();
    await expect(h1(page)).toHaveText('Packages');
    await page.goForward();
    await expect(h1(page)).toHaveText('Content');
    await expect(page).toHaveTitle('RainFocus Summit · Claude');
  });

  test('an unknown hash falls back to the guide and is rewritten', async ({ page }) => {
    await boot(page, { hash: 'nowhere', mode: 'paper' });
    await expect(page).toHaveURL(/#guide$/);
    await expect(h1(page)).toHaveText('Event setup guide');
  });

  test('the hash view is honored when entering Brandon\'s Mode', async ({ page }) => {
    await boot(page, { hash: 'discounts', mode: 'paper' });
    await expect(h1(page)).toHaveText('Discounts');
  });

  test('attendees group collapses, persists, and is forced open on a child route', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    const toggle = sidebarNav(page).getByRole('button', { name: 'Collapse Attendees' });
    await toggle.click();
    await expect(sidebarNav(page).getByRole('button', { name: 'Expand Attendees' })).toHaveAttribute('aria-expanded', 'false');
    await page.waitForTimeout(400);
    await page.reload();
    await page.evaluate(() => window.__rf.setMode('paper', { instant: true }));
    await expect(sidebarNav(page).getByRole('button', { name: 'Expand Attendees' })).toBeVisible();
    await page.evaluate(() => (window.location.hash = 'reg-codes'));
    await expect(sidebarNav(page).getByRole('button', { name: 'Collapse Attendees' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('command palette: open, search a page, execute, close', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await page.keyboard.press('ControlOrMeta+k');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(dialog).toBeVisible();
    await page.keyboard.type('reg');
    await expect(dialog.getByRole('option').first()).toContainText('Reg codes');
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(h1(page)).toHaveText('Reg codes');
    await page.keyboard.press('ControlOrMeta+k');
    await expect(dialog.getByText('Recent')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('command palette: no results, an action, and a reg code copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await boot(page, { mode: 'paper' });
    await paper(page).getByRole('button', { name: /Search pages/ }).click();
    const input = page.getByRole('combobox', { name: /Search pages/ });
    await input.fill('zzqq');
    await expect(page.getByText('No results for ‘zzqq’')).toBeVisible();
    await input.fill('toggle theme');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.keyboard.press('ControlOrMeta+k');
    await input.fill('RF-VIP');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Copied RF-VIP-GOLD')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('RF-VIP-GOLD');
  });

  test('account menu: theme, reduce motion, about, sign out and back in', async ({ page }) => {
    await boot(page, { mode: 'paper' });
    await paper(page).getByRole('button', { name: 'FL, Account' }).first().click();
    const menu = page.getByRole('dialog', { name: 'Account' });
    await menu.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const motion = menu.getByRole('switch', { name: 'Reduce motion' });
    await motion.click();
    await expect(motion).toHaveAttribute('aria-checked', 'true');
    await expect(menu.getByText('On', { exact: true })).toBeVisible();
    await menu.getByRole('button', { name: 'About this build' }).click();
    const about = page.getByRole('dialog', { name: 'About this build' });
    await expect(about).toBeVisible();
    await expect(about.getByRole('link', { name: /Portfolio/ })).toHaveAttribute('href', 'https://www.brandonchurchportfolio.com');
    await about.getByRole('button', { name: 'Close' }).last().click();
    await expect(about).toBeHidden();
    await paper(page).getByRole('button', { name: 'FL, Account' }).first().click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: "You're signed out" })).toBeVisible();
    await page.getByRole('button', { name: 'Sign in as First Name Last Name' }).click();
    await expect(h1(page)).toHaveText('Event setup guide');
  });

  test('event switcher switches the whole app to another event', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendees' });
    await page.getByRole('button', { name: /switch event/i }).first().click();
    const menu = page.getByRole('menu', { name: 'Switch event' });
    await expect(menu.getByRole('menuitemradio', { name: /RainFocus Summit/ })).toHaveAttribute('aria-checked', 'true');
    await menu.getByRole('menuitemradio', { name: /Horizon Developer Days/ }).click();
    await expect(paper(page).getByText('Everyone registered for Horizon Developer Days.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Current event: Horizon Developer Days/ }).first()).toBeVisible();
    expect(await page.evaluate(() => window.__rf.getState().activeEventId)).toBe('evt-horizon-dev-days');
  });

  test('toasts: at most three, undo-free copies stack newest last', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await boot(page, { mode: 'paper' });
    for (const code of ['RF-VIP', 'RF-SPKR', 'RF-STAFF', 'RF-PRESS']) {
      await page.keyboard.press('ControlOrMeta+k');
      await page.getByRole('combobox', { name: /Search pages/ }).fill(code);
      await page.keyboard.press('Enter');
    }
    const host = page.getByRole('region', { name: 'Notifications' });
    await expect(host.getByText(/^Copied/)).toHaveCount(3);
    await expect(host.getByText('Copied RF-VIP-GOLD')).toHaveCount(0);
    await expect(host.getByText(/^Copied/).last()).toHaveText('Copied RF-PRESS-26');
  });

  test('lg: icon rail with a flyout for the attendee sections', async ({ page }) => {
    await boot(page, { mode: 'paper', width: 1024, height: 800 });
    await expect(sidebarNav(page)).toBeHidden();
    const rail = page.getByRole('complementary', { name: 'App' });
    await rail.getByRole('link', { name: /Attendees/ }).hover();
    const flyout = page.getByRole('menu', { name: 'Attendees' });
    await expect(flyout).toBeVisible();
    await flyout.getByRole('menuitem', { name: 'Discounts' }).click();
    await expect(h1(page)).toHaveText('Discounts');
  });
});

test.describe('shell · mobile 390', () => {
  test('top bar, drawer and bottom tabs', async ({ page }) => {
    await boot(page, { mode: 'paper', width: 390, height: 844 });
    const tabs = page.getByRole('navigation', { name: 'Sections', exact: true });
    await tabs.getByRole('link', { name: 'Content' }).click();
    await expect(h1(page)).toHaveText('Content');
    await expect(tabs.getByRole('link', { name: 'Content' })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigation' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'Packages' }).click();
    await expect(drawer).toBeHidden();
    await expect(h1(page)).toHaveText('Packages');
    await expect(tabs.getByRole('link', { name: 'Attendees' })).toHaveAttribute('aria-current', 'page');
    const strip = page.getByRole('navigation', { name: 'Attendee sections' });
    await strip.getByRole('link', { name: 'Codes' }).click();
    await expect(h1(page)).toHaveText('Reg codes');
  });
});
