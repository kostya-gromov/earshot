/*
 * M0 smoke test for the reference page: the essentials work in a real browser.
 * Full behavior measurement against the rules is the engine's job (M1); this only
 * guards the extraction from the prototype.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const chips = (page: Page) =>
  page.getByRole('list', { name: 'Selected people' }).getByRole('listitem');
const input = (page: Page) => page.getByRole('combobox', { name: 'To' });
const status = (page: Page) => page.getByRole('status');

test.beforeEach(async ({ page }) => {
  await page.goto('/input-with-chips/');
  await expect(page.locator('[data-chip-field][data-ready="true"]')).toBeVisible();
  await input(page).focus();
});

test('starts with three chips and focus in the input', async ({ page }) => {
  await expect(chips(page)).toHaveText(
    ['Irene Oh', 'Greg Fisher', 'Hiroshi Matsui'].map((n) => new RegExp(n)),
  );
  await expect(input(page)).toBeFocused();
});

test('Backspace twice: first focuses the last chip, second removes it and announces', async ({
  page,
}) => {
  await page.keyboard.press('Backspace');
  await expect(page.getByRole('button', { name: 'Remove Hiroshi Matsui' })).toBeFocused();
  await expect(chips(page)).toHaveCount(3);

  await page.keyboard.press('Backspace');
  await expect(chips(page)).toHaveCount(2);
  await expect(status(page)).toHaveText('Hiroshi Matsui removed. 2 selected');
  await expect(page.getByRole('button', { name: 'Remove Greg Fisher' })).toBeFocused();
});

test('arrows move between chips and back to the input', async ({ page }) => {
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Remove Hiroshi Matsui' })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Remove Greg Fisher' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(input(page)).toBeFocused();
});

test('the field is one Tab stop', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Subject' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(input(page)).toBeFocused();
});

test('Tab from a chip leaves the field in one step', async ({ page }) => {
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Remove Hiroshi Matsui' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Subject' })).toBeFocused();
});

test('Shift+Tab from a chip leaves the field backwards', async ({ page }) => {
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('[data-chip-field] :focus')).toHaveCount(0);
});

test('clicking remove returns focus to the input and announces', async ({ page }) => {
  await page.getByRole('button', { name: 'Remove Greg Fisher' }).click();
  await expect(chips(page)).toHaveCount(2);
  await expect(input(page)).toBeFocused();
  await expect(status(page)).toHaveText('Greg Fisher removed. 2 selected');
});

test('typed names are rendered as text, never as markup', async ({ page }) => {
  const payload = '<img src=x onerror="window.__pwned=1">';
  await input(page).fill(payload);
  await page.keyboard.press('Enter');

  await expect(chips(page).last()).toContainText(payload);
  await expect(page.locator('.chip img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as { __pwned?: number }).__pwned)).toBeUndefined();
});

test('has no axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

// Design review 2026-11-15: the box shows focus with a border colour and a shadow, and forced
// colours remove both, so a focused input showed only its caret (WCAG 2.4.7).
test('in forced colours the focused input still has a visible focus indicator', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await input(page).focus();
  const outline = await page
    .locator('.chip-field__box')
    .evaluate((box) => getComputedStyle(box).outlineStyle);
  expect(outline).toBe('solid');
});

// Design review 2026-11-15: the active suggestion was marked by a faint tint alone (1.2:1 against
// the list). The combobox reference and its own design requirement ask for an indicator at 3:1.
test('the active suggestion is marked by an outline, not by a tint alone', async ({ page }) => {
  await input(page).focus();
  await page.keyboard.type('ma');
  await page.keyboard.press('ArrowDown');
  const outline = await page
    .locator('[role="option"][aria-selected="true"]')
    .evaluate((option) => getComputedStyle(option).outlineStyle);
  expect(outline).toBe('solid');
});
