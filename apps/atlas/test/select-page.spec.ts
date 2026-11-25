import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The select, the sixth pattern. It was built and reviewed on a preview route and moved to the
// patterns on 2026-11-25, after the VoiceOver check
// (docs/a11y-checks/2026-11-25-select-voiceover.md).
test.beforeEach(async ({ page }) => {
  await page.goto('/patterns/select/');
});

test('the page is one of the patterns, and nothing is left at the preview address', async ({
  page,
}) => {
  await expect(page.getByText('Preview, not published.')).toHaveCount(0);
  const kicker = page
    .locator('main p')
    .filter({ hasText: /^Pattern/ })
    .first();
  await expect(kicker).toContainText('6 of 6');
  await page.goto('/patterns/');
  await expect(page.getByRole('main').locator('a[href="/patterns/select/"]').first()).toBeVisible();
  const old = await page.goto('/lab/patterns/select/');
  expect(old?.status()).toBe(404);
});

test('"For design" draws the select as a select: its value and a chevron, not typed text', async ({
  page,
}) => {
  const lens = page.getByRole('tabpanel', { name: /For design/ });
  await expect(
    lens.getByText('Use the browser’s own select unless it cannot do what the list needs'),
  ).toBeVisible();
  await expect(lens.getByText('<select>')).toBeVisible();
  await expect(lens.getByText('Banana').first()).toBeVisible();
});

test('the five measured systems are the columns of the matrix', async ({ page }) => {
  const systems = page.getByRole('columnheader');
  await expect(systems).toHaveCount(5);
  for (const name of ['Atlassian', 'Chakra UI', 'Fluent 2', 'MUI', 'React Aria']) {
    await expect(systems.filter({ hasText: name })).toHaveCount(1);
  }
});

test('a recording is drawn as a select, its value from the tree', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/patterns/select/#rule-enter');
  const panel = page.locator('[role="tabpanel"][id="rule-enter"]');
  await expect(panel).toContainText('Value “Cherry”.');
});

test('focus on the list itself is said as such', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/patterns/select/#rule-focus-stays');
  const panel = page.locator('[role="tabpanel"][id="rule-focus-stays"]');
  await panel
    .getByRole('button', { name: /Chakra UI/ })
    .first()
    .click();
  await expect(panel).toContainText('Focus on the list itself.');
});

test('an initialism keeps its capitals after “Alternative:”', async ({ page }) => {
  await page.goto('/patterns/select/#rule-focus-stays');
  const panel = page.locator('[role="tabpanel"][id="rule-focus-stays"]');
  await expect(panel).toContainText('Alternative: DOM focus moves into the open list');
});

test('has no axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test.describe('the playground runs the reference select', () => {
  const transcript = (page: Page) => page.getByRole('log', { name: 'Transcript' });

  test('says the value with the name, and the active option as the arrows move', async ({
    page,
  }) => {
    await page.locator('[data-select][data-ready="true"]').waitFor();
    const select = page.locator('[data-select] [role="combobox"]');
    await select.focus();
    await expect(transcript(page)).toContainText('Fruit, combobox, Banana, collapsed');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(transcript(page)).toContainText('Cherry, option, 4 of 5, selected');
    await page.keyboard.press('Enter');
    await expect(select).toHaveText('Cherry');
  });

  test('the tour completes on real keys', async ({ page }) => {
    await page.locator('[data-select][data-ready="true"]').waitFor();
    await page.locator('[data-select] [role="combobox"]').focus();
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowUp', 'Enter', 'ArrowDown', 'Escape']) {
      await page.keyboard.press(key);
    }
    await expect(page.getByText('4 of 4 tried')).toBeVisible();
  });
});

test('a select drawn without a value says so in words on the same frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/patterns/select/#rule-name-and-value');
  const panel = page.locator('[role="tabpanel"][id="rule-name-and-value"]');
  await panel
    .getByRole('button', { name: /React Aria/ })
    .first()
    .click();
  await expect(panel).toContainText('No value. Focus on the select.');
});
