/*
 * Smoke test for the reference modal dialog: the essentials work in a real browser. Measuring it
 * against the rules is the engine's job; this guards the page the engine opens.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const opener = (page: Page) => page.getByRole('button', { name: 'Edit profile', exact: true });
const dialog = (page: Page) => page.getByRole('dialog');
const inDialog = (page: Page, role: 'button' | 'textbox', name: string) =>
  dialog(page).getByRole(role, { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/dialog/');
  await expect(page.locator('[data-dialog][data-ready="true"]')).toBeVisible();
  await opener(page).focus();
  await page.keyboard.press('Enter');
});

test('opens named by its title, marked modal, with focus on the first field', async ({ page }) => {
  await expect(dialog(page)).toHaveAccessibleName('Edit profile');
  await expect(inDialog(page, 'textbox', 'Name')).toBeFocused();
  // Opened with showModal(), not show(): only then is the page behind inert.
  await expect(page.locator('dialog:modal')).toHaveCount(1);
});

test('Tab and Shift+Tab stay inside and wrap at both ends', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(inDialog(page, 'button', 'Cancel')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(inDialog(page, 'button', 'Save')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(inDialog(page, 'textbox', 'Name')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(inDialog(page, 'button', 'Save')).toBeFocused();
});

test('Escape closes it and focus is back on the button, also with text typed', async ({ page }) => {
  await page.keyboard.type('Ada');
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0);
  await expect(opener(page)).toBeFocused();
});

test('Cancel closes it and focus is back on the button', async ({ page }) => {
  await inDialog(page, 'button', 'Cancel').click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(opener(page)).toBeFocused();
});

test('a click on a field outside neither focuses it nor closes the dialog', async ({ page }) => {
  // By coordinates: the field is inert, so a locator click would wait for it forever.
  const box = (await page.locator('#notes').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#notes')).not.toBeFocused();
});

test('has no axe violations in either colour scheme, open', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  }
});
