import { test, expect, type Page } from '@playwright/test';
import { boot, toastText } from '../helpers';

const main = (page: Page) => page.locator('#paper-main');
const types = (page: Page) => page.evaluate(() => window.__rf.getState().events['evt-rainfocus-summit'].attendeeTypes as Array<{ name: string; isDefault: boolean; swatch: string }>);
const rowButton = (page: Page, name: string) => main(page).getByRole('button', { name: new RegExp(`^${name}[.,]`) });
const menu = async (page: Page, name: string) => {
  await main(page).locator('[data-row]').filter({ has: page.getByRole('button', { name: new RegExp(`^${name}[.,]`) }) }).hover();
  await main(page).getByRole('button', { name: `${name} actions`, exact: true }).click();
};

test.describe('attendee types', () => {
  test('lists the seeded types with counts and the default', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendee-types' });
    await expect(main(page).locator('[data-row]')).toHaveCount(7);
    await expect(rowButton(page, 'Attendee')).toHaveAccessibleName(/default type\. 168 attendees/);
  });

  test('add with name validation and a color', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendee-types' });
    await main(page).getByRole('button', { name: 'Add type' }).click();
    const name = main(page).getByLabel('Name');
    await expect(name).toBeFocused();
    await name.fill('Speaker');
    await page.keyboard.press('Enter');
    await expect(main(page).getByText('Another type already has this name')).toBeVisible();
    await name.fill('Volunteer');
    await main(page).getByRole('radio', { name: 'Lime' }).click();
    await main(page).getByRole('button', { name: 'Add type' }).last().click();
    await expect(toastText(page, 'Added Volunteer')).toBeVisible();
    const t = (await types(page)).at(-1)!;
    expect(t).toMatchObject({ name: 'Volunteer', swatch: 'lime', isDefault: false });
  });

  test('edit inline, Escape cancels, Enter saves', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendee-types' });
    await rowButton(page, 'Press').click();
    await main(page).getByLabel('Name').fill('Media');
    await page.keyboard.press('Escape');
    await expect(rowButton(page, 'Press')).toBeVisible();
    await rowButton(page, 'Press').click();
    await main(page).getByLabel('Name').fill('Media');
    await page.keyboard.press('Enter');
    await expect(toastText(page, 'Saved Media')).toBeVisible();
  });

  test('set as default moves the chip; the default cannot be removed', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendee-types' });
    await menu(page, 'Speaker');
    await page.getByRole('menuitem', { name: 'Set as default' }).click();
    await expect(toastText(page, 'Speaker is now the default type')).toBeVisible();
    expect((await types(page)).find((t) => t.isDefault)!.name).toBe('Speaker');
    await menu(page, 'Speaker');
    await expect(page.getByRole('menuitem', { name: 'Remove' })).toHaveAttribute('aria-disabled', 'true');
  });

  test('duplicate opens the copy in edit mode', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendee-types' });
    await menu(page, 'VIP');
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(main(page).getByLabel('Name')).toHaveValue('VIP copy');
    expect((await types(page)).map((t) => t.name).indexOf('VIP copy')).toBe(3);
  });

  test('remove unused with confirm and undo', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendee-types' });
    await main(page).getByRole('button', { name: 'Add type' }).click();
    await main(page).getByLabel('Name').fill('Temp');
    await page.keyboard.press('Enter');
    await menu(page, 'Temp');
    await page.getByRole('menuitem', { name: 'Remove' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click();
    await expect(rowButton(page, 'Temp')).toHaveCount(0);
    await toastText(page, 'Removed Temp').locator('..').getByRole('button', { name: /Undo/ }).click();
    await expect(rowButton(page, 'Temp')).toBeVisible();
  });

  test('remove in use reassigns attendees and workflows, undo moves them back', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendee-types' });
    await menu(page, 'Staff');
    await page.getByRole('menuitem', { name: 'Remove' }).click();
    const modal = page.getByRole('alertdialog', { name: 'Remove Staff?' });
    await expect(modal).toContainText('18 attendees and 1 workflow use this type');
    await modal.getByRole('combobox', { name: 'Move them to' }).click();
    await page.getByRole('option', { name: 'Employee' }).click();
    await modal.getByRole('button', { name: 'Remove and reassign' }).click();
    const st = await page.evaluate(() => window.__rf.getState().events['evt-rainfocus-summit']);
    const emp = st.attendeeTypes.find((t: { name: string }) => t.name === 'Employee').id;
    expect(st.attendeeTypes.some((t: { name: string }) => t.name === 'Staff')).toBe(false);
    expect(st.attendees.filter((a: { attendeeTypeId: string }) => a.attendeeTypeId === emp)).toHaveLength(34);
    expect(st.guide.workflows.find((w: { name: string }) => w.name === 'Staff Registration').attendeeTypeId).toBe(emp);
    expect(st.attendees.find((a: { attendeeTypeId: string; activity: Array<{ text: string }> }) => a.activity[0].text.includes('during removal of Staff'))).toBeTruthy();
    await toastText(page, 'Removed Staff').locator('..').getByRole('button', { name: /Undo/ }).click();
    const back = await page.evaluate(() => window.__rf.getState().events['evt-rainfocus-summit']);
    const staff = back.attendeeTypes.find((t: { name: string }) => t.name === 'Staff').id;
    expect(back.attendees.filter((a: { attendeeTypeId: string }) => a.attendeeTypeId === staff)).toHaveLength(18);
    expect(back.attendeeTypes.map((t: { name: string }) => t.name).indexOf('Staff')).toBe(3);
  });

  test('reorder by keyboard persists', async ({ page }) => {
    await boot(page, { mode: 'paper', hash: 'attendee-types' });
    await main(page).getByRole('button', { name: 'Reorder Press' }).focus();
    for (const k of ['Space', 'ArrowUp', 'ArrowUp', 'Space']) {
      await page.keyboard.press(k);
      await page.waitForTimeout(150);
    }
    await expect.poll(async () => (await types(page)).map((t) => t.name).indexOf('Press')).toBe(4);
  });
});
