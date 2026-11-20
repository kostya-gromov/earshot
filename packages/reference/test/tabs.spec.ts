/*
 * Smoke test for the reference tabs: the essentials work in a real browser. Measuring it against
 * the rules is the engine's job; this guards the page the engine opens.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true });
const shownPanel = (page: Page) => page.getByRole('tabpanel');

test.beforeEach(async ({ page }) => {
  await page.goto('/tabs/');
  await expect(page.locator('[data-tabs][data-ready="true"]')).toBeVisible();
});

test('Tab from the field before lands on the active tab, then on its panel', async ({ page }) => {
  await tab(page, 'Members').click();
  await page.getByRole('textbox', { name: 'Project name' }).focus();
  await page.keyboard.press('Tab');
  await expect(tab(page, 'Members')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(shownPanel(page)).toBeFocused();
  await expect(shownPanel(page)).toHaveAccessibleName('Members');
});

test('arrows move, activate and wrap; Up and Down Arrow do nothing', async ({ page }) => {
  await tab(page, 'Overview').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(tab(page, 'Settings')).toBeFocused();
  await expect(tab(page, 'Settings')).toHaveAttribute('aria-selected', 'true');
  await expect(shownPanel(page)).toHaveAccessibleName('Settings');
  await page.keyboard.press('ArrowRight');
  await expect(tab(page, 'Overview')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(tab(page, 'Overview')).toBeFocused();
});

test('Home and End go to the ends', async ({ page }) => {
  await tab(page, 'Overview').focus();
  await page.keyboard.press('End');
  await expect(tab(page, 'Settings')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tab(page, 'Overview')).toBeFocused();
});

test('has no axe violations in either colour scheme', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    const { violations } = await new AxeBuilder({ page }).include('main').analyze();
    expect(violations).toEqual([]);
  }
});

// The page's requirement "Selected and focused look different": the focus ring never covers the
// selected tab's bar. Judged on pixels: the bar looks the same with focus on the tab and without.
for (const colorScheme of ['light', 'dark'] as const) {
  test(`the focus ring leaves the selected bar visible, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    const selected = tab(page, 'Activity');
    await tab(page, 'Overview').focus();
    await page.keyboard.press('ArrowRight');
    await expect(selected).toHaveAttribute('aria-selected', 'true');
    const box = (await selected.boundingBox())!;
    const bar = { x: box.x + 6, y: box.y + box.height - 3, width: box.width - 12, height: 3 };
    const focused = await page.screenshot({ clip: bar });
    // Focus leaves the page's elements altogether: Tab would put the panel's own ring next to it.
    await selected.evaluate((element) => element.blur());
    await expect(selected).not.toBeFocused();
    expect(Buffer.compare(focused, await page.screenshot({ clip: bar }))).toBe(0);
  });
}
