/*
 * Smoke test for the reference menu button: the essentials work in a real browser. Measuring it
 * against the rules is the engine's job; this guards the page the engine opens.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const button = (page: Page) => page.getByRole('button', { name: 'Actions' });
const menu = (page: Page) => page.getByRole('menu', { name: 'Actions' });
const item = (page: Page, name: string) => menu(page).getByRole('menuitem', { name });
const lastAction = (page: Page) => page.locator('#last-action');

test.beforeEach(async ({ page }) => {
  await page.goto('/menu-button/');
  await expect(page.locator('[data-menu-button][data-ready="true"]')).toBeVisible();
  await button(page).focus();
});

test('starts closed, and Enter opens the menu on its first item', async ({ page }) => {
  await expect(menu(page)).toBeHidden();
  await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(item(page, 'Rename')).toBeFocused();
});

test('Space opens once: its keyup does not close the menu again', async ({ page }) => {
  await page.keyboard.press('Space');
  await expect(item(page, 'Rename')).toBeFocused();
  await expect(menu(page)).toBeVisible();
});

test('arrows move through every item, the disabled one included, and wrap', async ({ page }) => {
  await page.keyboard.press('Enter');
  for (const name of ['Duplicate', 'Archive', 'Delete', 'Rename']) {
    await page.keyboard.press('ArrowDown');
    await expect(item(page, name)).toBeFocused();
  }
  await page.keyboard.press('ArrowUp');
  await expect(item(page, 'Delete')).toBeFocused();
});

test('Enter runs the item’s action, closes the menu and returns to the button', async ({
  page,
}) => {
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(lastAction(page)).toHaveText('Last action: Duplicate');
  await expect(menu(page)).toBeHidden();
  await expect(button(page)).toBeFocused();
});

test('Enter on the disabled item runs nothing and the menu stays', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Archive')).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await expect(lastAction(page)).toHaveText('Last action: none');
  await expect(item(page, 'Archive')).toBeFocused();
});

test('Escape closes and returns to the button; Tab leaves and closes', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeHidden();
  await expect(button(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Note' })).toBeFocused();
  await expect(menu(page)).toBeHidden();
});

test('a click opens the menu and a click on an item runs it', async ({ page }) => {
  await button(page).click();
  await item(page, 'Delete').click();
  await expect(lastAction(page)).toHaveText('Last action: Delete');
  await expect(menu(page)).toBeHidden();
});

test('has no axe violations, closed and open', async ({ page }) => {
  const scan = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect((await scan()).violations).toEqual([]);
  await page.keyboard.press('Enter');
  expect((await scan()).violations).toEqual([]);
});
