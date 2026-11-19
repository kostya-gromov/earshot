import { expect, test, type Page } from '@playwright/test';

const ruleset = (page: Page) => page.getByRole('region', { name: 'Try each rule' });
const step = (page: Page, rule: string) => ruleset(page).locator(`[data-rule="${rule}"]`);
const input = (page: Page) =>
  page.getByTestId('live-reference').getByRole('combobox', { name: 'To' });

test.beforeEach(async ({ page }) => {
  await page.goto('/patterns/input-with-chips/');
  await page.locator('[data-chip-field][data-ready="true"]').waitFor();
});

test('Backspace twice with real keys completes its rule and lights it', async ({ page }) => {
  await input(page).focus();
  await page.keyboard.press('Backspace');
  await expect(step(page, 'bsp')).toHaveAttribute('data-lit', 'true');
  await page.keyboard.press('Backspace');
  await expect(step(page, 'bsp').locator('[data-done]')).toBeVisible();
  await expect(ruleset(page).getByText('1 of 4', { exact: true })).toBeVisible();
  await expect(ruleset(page).getByRole('status')).toHaveText(
    'Tried: Backspace twice to remove. 1 of 4.',
  );
});

test('arrows complete after stepping into the chips and back out', async ({ page }) => {
  await input(page).focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await expect(step(page, 'arrows').locator('[data-done]')).toBeVisible();
});

test('one Tab out of the field completes the tab rule', async ({ page }) => {
  await input(page).focus();
  await page.keyboard.press('Tab');
  await expect(step(page, 'tab').locator('[data-done]')).toBeVisible();
});

test('adding a person completes "say" when the addition is announced', async ({ page }) => {
  await input(page).focus();
  await page.keyboard.type('ma');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(step(page, 'say').locator('[data-done]')).toBeVisible();
});

test('Watch it lights rules but never completes the tour', async ({ page }) => {
  await page.getByRole('button', { name: 'Watch it' }).click();
  await expect(step(page, 'bsp')).toHaveAttribute('data-lit', 'true', { timeout: 4000 });
  await expect(page.getByRole('log', { name: 'Transcript' })).toContainText(
    'Hiroshi Matsui removed. 2 selected',
    { timeout: 6000 },
  );
  await expect(ruleset(page).getByText('0 of 4', { exact: true })).toBeVisible();
});

test('each rule links to its row with the evidence', async ({ page }) => {
  await expect(
    step(page, 'bsp').getByRole('link', { name: /Backspace twice to remove/ }),
  ).toHaveAttribute('href', '#rule-bsp');
});
