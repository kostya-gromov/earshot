import { expect, test, type Page } from '@playwright/test';

// One press of the pointer is one line at most (4578d98): a click once said every place focus
// passed through on its way, faster than it could be read.
const lines = (page: Page) => page.getByRole('log', { name: 'Transcript' }).locator('q');

test('removing a chip with the mouse says the removal once, and nothing about focus', async ({
  page,
}) => {
  await page.goto('/patterns/input-with-chips/');
  const stage = page.getByTestId('live-reference');
  await page.locator('[data-chip-field][data-ready="true"]').waitFor();
  await stage.getByRole('combobox', { name: 'To' }).click();
  await expect(lines(page)).toHaveText(['To, combobox, collapsed']);
  await stage.getByRole('button', { name: 'Remove Irene Oh' }).click();
  // Focus went back to the field it left: only the live region's message is new.
  await expect(lines(page)).toHaveText(['To, combobox, collapsed', 'Irene Oh removed. 2 selected']);
  await page.waitForTimeout(300);
  await expect(lines(page)).toHaveCount(2);
});

test('a click on the menu button says the item focus ends on, once', async ({ page }) => {
  await page.goto('/patterns/menu-button/');
  const stage = page.getByTestId('live-reference');
  await stage.locator('[data-ready="true"]').waitFor();
  await stage.getByRole('button', { name: 'Actions' }).click();
  await expect(lines(page)).toHaveText(['Rename, menuitem, 1 of 4']);
  await page.waitForTimeout(300);
  await expect(lines(page)).toHaveCount(1);
});

test('keys still say each move of focus', async ({ page }) => {
  await page.goto('/patterns/menu-button/');
  const stage = page.getByTestId('live-reference');
  await stage.locator('[data-ready="true"]').waitFor();
  await stage.getByRole('button', { name: 'Actions' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(lines(page).last()).toHaveText(/^Duplicate, menuitem, 2 of 4/);
});
