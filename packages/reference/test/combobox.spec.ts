/*
 * Smoke test for the combobox reference page: the essentials work in a real browser. Judging it
 * against the rules is the engine's job; this guards the page the engine opens.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const input = (page: Page) => page.getByRole('combobox', { name: 'Fruit' });
const options = (page: Page) => page.getByRole('listbox', { name: 'Fruit' }).getByRole('option');
const status = (page: Page) => page.getByRole('status');

test.beforeEach(async ({ page }) => {
  await page.goto('/combobox/');
  await expect(page.locator('[data-combobox][data-ready="true"]')).toBeVisible();
  await input(page).focus();
});

test('starts closed and empty', async ({ page }) => {
  await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(input(page)).toHaveValue('');
  await expect(options(page)).toHaveCount(0);
});

test('typing filters, says how many, and selects nothing by itself', async ({ page }) => {
  await page.keyboard.type('a');
  await expect(options(page)).toHaveText(['Apple', 'Apricot', 'Avocado']);
  await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(input(page)).not.toHaveAttribute('aria-activedescendant');
  await expect(status(page)).toHaveText('3 suggestions');
});

test('arrows move the active option while focus stays in the input', async ({ page }) => {
  await page.keyboard.type('a');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(input(page)).toBeFocused();
  const apricot = options(page).nth(1);
  await expect(apricot).toHaveAttribute('aria-selected', 'true');
  await expect(input(page)).toHaveAttribute(
    'aria-activedescendant',
    (await apricot.getAttribute('id'))!,
  );
  await expect(page.locator('[role="option"][aria-selected="true"]')).toHaveCount(1);
});

test('Enter accepts the active option and closes', async ({ page }) => {
  await page.keyboard.type('a');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(input(page)).toHaveValue('Apple');
  await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(options(page)).toHaveCount(0);
});

test('Escape closes and keeps focus; Tab leaves in one step', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await expect(options(page)).toHaveCount(6);
  await page.keyboard.press('Escape');
  await expect(options(page)).toHaveCount(0);
  await expect(input(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Note' })).toBeFocused();
});

test('text that matches nothing closes the popup and says so', async ({ page }) => {
  await page.keyboard.type('z');
  await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(status(page)).toHaveText('No suggestions');
});

test('has no axe violations, closed or open', async ({ page }) => {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('ArrowDown');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
