import { expect, test, type Page } from '@playwright/test';

// The opening rebuilt on 2026-11-15: the recorded scene is the first thing under the statement,
// across the full width, in one frame with its line of provenance.
test.describe('the opening', () => {
  const scene = (page: Page) => page.getByRole('region', { name: /These fields look the same/ });

  test('at 1440 px the whole recorded scene is in the first view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const lanes = scene(page).getByText(/^(Atlassian|Chakra UI|Fluent 2|MUI)\s/);
    await expect(lanes).toHaveCount(4);
    for (const lane of await lanes.all()) await expect(lane).toBeInViewport({ ratio: 1 });
  });

  test('the frame says where the recording comes from, beside its one control', async ({
    page,
  }) => {
    await page.goto('/');
    const facts = scene(page).getByRole('list').first();
    await expect(facts.getByRole('listitem')).toHaveText([
      'Input with chips',
      /Backspace once, in an empty field/,
      'Run 1 of 3',
    ]);
    await expect(scene(page).getByRole('button', { name: /Press/ })).toHaveCount(1);
  });

  test('why it matters and how the lines were made are said under the frame', async ({ page }) => {
    await page.goto('/');
    await expect(scene(page)).toContainText(
      'Accessibility checkers test markup, not what happens after a key press.',
    );
    await expect(scene(page)).toContainText(
      'Spoken lines are a semantic model, not screen reader output.',
    );
  });

  test('at 390 px the frame stacks and nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    // The scene starts in the first view, under the statement and the buttons.
    await expect(scene(page).getByRole('heading')).toBeInViewport();
  });
});
