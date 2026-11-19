import { expect, test, type Page } from '@playwright/test';

const button = (page: Page) => page.getByRole('banner').getByRole('button', { name: 'Menu' });
const panel = (page: Page) => page.getByRole('navigation', { name: 'Menu' });

test('the button opens the panel and says it is expanded', async ({ page }) => {
  await page.goto('/patterns/combobox/');
  await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(panel(page)).toBeHidden();
  await button(page).click();
  await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole('link', { name: /Combobox/ })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('Escape closes the panel and puts focus back on the button', async ({ page }) => {
  await page.goto('/patterns/combobox/');
  await button(page).click();
  await panel(page).getByRole('link').first().focus();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toBeHidden();
  await expect(button(page)).toBeFocused();
  await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
});

test('a press outside the panel closes it', async ({ page }) => {
  await page.goto('/patterns/combobox/');
  await button(page).click();
  await expect(panel(page)).toBeVisible();
  await page.getByRole('main').getByRole('heading', { level: 1 }).click();
  await expect(panel(page)).toBeHidden();
});

test('focus leaving the panel closes it', async ({ page }) => {
  await page.goto('/methodology/');
  await button(page).click();
  // The theme's last button is the panel's last stop.
  await panel(page).getByRole('button', { name: 'Dark' }).focus();
  await page.keyboard.press('Tab');
  await expect(panel(page)).toBeHidden();
});

test('a pattern page lists its sections, and the home page has none to list', async ({ page }) => {
  await page.goto('/patterns/input-with-chips/');
  await button(page).click();
  await expect(panel(page).getByRole('heading', { name: 'On this page' })).toBeVisible();
  await expect(panel(page).getByRole('link', { name: 'Playground' })).toHaveAttribute(
    'href',
    '#playground-title',
  );
  await page.goto('/');
  await button(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole('heading', { name: 'On this page' })).toHaveCount(0);
});

test('following a section closes the panel', async ({ page }) => {
  await page.goto('/patterns/input-with-chips/');
  await button(page).click();
  await panel(page).getByRole('link', { name: 'The rules' }).click();
  await expect(page).toHaveURL(/#evidence-title$/);
  await expect(panel(page)).toBeHidden();
});

// Design review 2026-11-19: with the Theme row, the bottom row set the panel's width (563 px
// on the home page), leaving the space above it empty. The columns set it; the row wraps.
for (const path of ['/', '/methodology/', '/patterns/input-with-chips/']) {
  test(`on ${path} the panel is as wide as its columns`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    await button(page).click();
    const widths = await panel(page).evaluate((nav) => ({
      panel: nav.getBoundingClientRect().width,
      // The columns themselves: their row is a block, as wide as the panel whatever sets it.
      columns: [...nav.firstElementChild!.children].reduce(
        (sum, column) => sum + column.getBoundingClientRect().width,
        0,
      ),
    }));
    // The panel's two 1 px borders, and a pixel for rounding.
    expect(widths.panel).toBeLessThanOrEqual(widths.columns + 3);
  });
}

// Design review 2026-11-19: "Multi-select" and "Overflow menu" were cut with "...".
test('no pattern alias in the menu is cut', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await button(page).click();
  const cut = await panel(page)
    .getByRole('link')
    .evaluateAll((links) =>
      links
        .flatMap((link) => [...link.querySelectorAll('span')])
        .filter((span) => span.scrollWidth > span.clientWidth + 1)
        .map((span) => span.textContent),
    );
  expect(cut).toEqual([]);
});
