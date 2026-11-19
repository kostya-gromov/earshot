import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The combobox replay, previewed on the lab page with measured recordings until the pattern has
// its own page. A screen reader user must get what the schematic shows.
const section = (page: Page) => page.locator('section[aria-labelledby="lab-combobox-replay"]');
const recording = (page: Page, title: RegExp) =>
  section(page).getByRole('article').filter({ hasText: title });

test.beforeEach(async ({ page }) => {
  await page.goto('/lab/');
});

test('the legend says in words what the two marks mean', async ({ page }) => {
  const legend = section(page).getByRole('list', { name: 'Legend' });
  // Each sign has its meaning in words; the samples of spoken lines are decoration.
  await expect(legend.getByRole('listitem')).toHaveText([
    /active option$/,
    /selected$/,
    /Said when focus lands$/,
    /Live region message$/,
  ]);
});

test('every step has a text equivalent with its place in the recording', async ({ page }) => {
  const steps = recording(page, /Reference.*type-then-move/).getByRole('listitem');
  await expect(steps).toHaveCount(4);
  await expect(steps.nth(1)).toContainText('Step 2 of 4:');
  // What changed is shown; the whole state is there for a screen reader.
  await expect(steps.nth(1)).toContainText('“Apple” active, 1 of 3, and selected.');
  await expect(steps.nth(1)).toContainText(
    '3 options, “Apple” active (1 of 3), “Apple” selected. Focus in the combobox',
  );
  // The spoken line is ordinary text, not a picture.
  await expect(steps.nth(1)).toContainText('Apple, option, 1 of 3, selected');
});

test('the schematic is hidden from assistive technology and adds nothing the text lacks', async ({
  page,
}) => {
  const step = recording(page, /Reference.*type-then-move/)
    .getByRole('listitem')
    .nth(2);
  // The schematic is the hidden block that holds the list; a keycap's glyph is hidden too.
  const schematic = step.locator('[aria-hidden="true"]:has(ul)');
  await expect(schematic).toBeVisible();
  // Both marks belong to the reference's active option: the travelling bar's mark and the row's check.
  await expect(schematic.locator('[data-mark="active"] svg')).toHaveCount(1);
  await expect(schematic.locator('li[data-active] svg')).toHaveCount(1);
});

test('a system whose marks sit on different options says so in words', async ({ page }) => {
  const last = recording(page, /MUI.*reopen/)
    .getByRole('listitem')
    .last();
  await expect(last).toContainText('“Apricot” active, 2 of 6. “Apple” stays selected.');
  await expect(last).toContainText('“Apricot” active (2 of 6), “Apple” selected');
});

test('a mark is never told apart by colour alone: the two differ in shape and side', async ({
  page,
}) => {
  const list = recording(page, /Reference.*type-then-move/)
    .locator('ul:has(li[data-active])')
    .first();
  const row = list.locator('li[data-active]');
  const active = await list.locator('[data-mark="active"] svg').boundingBox();
  const selected = await row.locator('svg').boundingBox();
  const name = await row.locator('span').nth(1).boundingBox();
  const rowBox = await row.boundingBox();
  // Left of the name, right of the name, and both on the active option's own row.
  expect(active!.x + active!.width).toBeLessThanOrEqual(name!.x);
  expect(selected!.x).toBeGreaterThanOrEqual(name!.x + name!.width - 1);
  expect(active!.y).toBeGreaterThanOrEqual(rowBox!.y);
  expect(active!.y + active!.height).toBeLessThanOrEqual(rowBox!.y + rowBox!.height);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the preview has no axe violations in the ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    // The theme is switched after the page has loaded, so colours are still in transition:
    // contrast is judged on the settled page, not mid-fade.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.timeline === document.timeline)
          .map((a) => a.finished.catch(() => undefined)),
      ),
    );
    const results = await new AxeBuilder({ page })
      .include('section[aria-labelledby="lab-combobox-replay"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
