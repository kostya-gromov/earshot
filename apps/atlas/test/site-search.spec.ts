import { expect, test, type Page } from '@playwright/test';

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Search' });
const combobox = (page: Page) => dialog(page).getByRole('combobox', { name: 'Search' });
const group = (page: Page, name: string) => dialog(page).getByRole('group', { name, exact: true });

async function openSearch(page: Page) {
  await page
    .getByRole('banner')
    .getByRole('button', { name: /^Search/ })
    .click();
  await expect(combobox(page)).toBeFocused();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/patterns/input-with-chips/');
});

test('before anything is typed it lists the patterns and the pages, not the rules', async ({
  page,
}) => {
  await openSearch(page);
  await expect(group(page, 'Patterns').getByRole('option')).not.toHaveCount(0);
  await expect(group(page, 'Pages').getByRole('option', { name: /^Methodology/ })).toBeVisible();
  await expect(group(page, 'Rules')).toHaveCount(0);
});

test('a rule is found by its key: “esc” finds the Escape rules', async ({ page }) => {
  await openSearch(page);
  await combobox(page).fill('esc');
  const rules = group(page, 'Rules');
  await expect(rules.getByRole('option', { name: /^Escape closes the popup/ })).toBeVisible();
  await expect(
    rules.getByRole('option', { name: /^Escape closes the menu and returns to the button/ }),
  ).toBeVisible();
  // The option names the pattern the rule belongs to.
  await expect(
    rules.getByRole('option', { name: /^Escape closes the popup/ }),
  ).toHaveAccessibleName(/Combobox$/);
});

test('Enter on a rule opens that rule’s tab on its pattern page', async ({ page }) => {
  await openSearch(page);
  await combobox(page).fill('escape closes the popup');
  await expect(group(page, 'Rules').getByRole('option')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/patterns\/combobox\/#rule-escape$/);
  await expect(dialog(page)).toBeHidden();
  const tab = page.getByRole('tablist', { name: 'Rules' }).getByRole('tab', { selected: true });
  await expect(tab).toContainText('Escape closes the popup');
});

test('Enter on a rule of the page already open selects its tab there', async ({ page }) => {
  await openSearch(page);
  await combobox(page).fill('backspace twice');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/patterns\/input-with-chips\/#rule-/);
  const tab = page.getByRole('tablist', { name: 'Rules' }).getByRole('tab', { selected: true });
  await expect(tab).toContainText(/Backspace/);
});

test('while the search is open the page under it does not scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => window.scrollTo(0, 600));
  await openSearch(page);
  const before = await page.evaluate(() => window.scrollY);
  // Over the backdrop, away from the window, where a wheel once scrolled the page behind.
  await page.mouse.move(20, 780);
  await page.mouse.wheel(0, 800);
  await page.keyboard.press('PageDown');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
  // The scrollbar's gutter stays, so nothing under the window shifts sideways.
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(width);
  await page.mouse.wheel(0, 800);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});
