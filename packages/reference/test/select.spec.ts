/*
 * Smoke test for the select reference page: the essentials work in a real browser. Judging it
 * against the rules is the engine's job; this guards the page the engine opens.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const select = (page: Page) => page.getByRole('combobox', { name: 'Fruit' });
const options = (page: Page) => page.getByRole('listbox', { name: 'Fruit' }).getByRole('option');
const active = (page: Page) => page.locator('[role="option"][aria-selected="true"]');

async function expectActive(page: Page, name: string) {
  await expect(active(page)).toHaveCount(1);
  await expect(active(page)).toHaveText(name);
  const id = (await active(page).getAttribute('id'))!;
  await expect(select(page)).toHaveAttribute('aria-activedescendant', id);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/select/');
  await expect(page.locator('[data-select][data-ready="true"]')).toBeVisible();
  await select(page).focus();
});

test('starts closed, named by its label, showing the chosen value', async ({ page }) => {
  await expect(select(page)).toHaveAccessibleName('Fruit');
  await expect(select(page)).toHaveText('Banana');
  await expect(select(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(options(page)).toHaveCount(0);
});

test('Down Arrow opens the list on the chosen option, focus staying on the select', async ({
  page,
}) => {
  await page.keyboard.press('ArrowDown');
  await expect(select(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(options(page)).toHaveCount(5);
  await expect(select(page)).toBeFocused();
  await expectActive(page, 'Banana');
});

test('arrows move one option and stop at either end', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  for (let i = 0; i < 6; i += 1) await page.keyboard.press('ArrowDown');
  await expectActive(page, 'Date');
  for (let i = 0; i < 6; i += 1) await page.keyboard.press('ArrowUp');
  await expectActive(page, 'Apple');
});

test('Enter chooses the active option, closes, and keeps focus', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(select(page)).toHaveText('Cherry');
  await expect(select(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(select(page)).not.toHaveAttribute('aria-activedescendant');
  await expect(select(page)).toBeFocused();
});

test('Escape closes and keeps the value it had', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(select(page)).toHaveText('Banana');
  await expect(options(page)).toHaveCount(0);
  await expect(select(page)).toBeFocused();
});

test('Tab with the list open chooses and moves on to the next field', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Notes')).toBeFocused();
  await expect(select(page)).toHaveText('Apricot');
  await expect(options(page)).toHaveCount(0);
});

test('typing a letter opens the list on the first option that starts with it', async ({ page }) => {
  await page.keyboard.press('c');
  await expectActive(page, 'Cherry');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600); // a pause starts a new search
  await page.keyboard.press('a');
  await expectActive(page, 'Apple');
  await page.keyboard.press('a');
  await expectActive(page, 'Apricot');
});

test('has no axe violations, open or closed', async ({ page }) => {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('ArrowDown');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
