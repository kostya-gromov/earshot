import { expect, test, type Page } from '@playwright/test';

// The opening rebuilt on 2026-11-25 (with Linear beside it): a quiet line for who it is
// for, the statement, one line, room, then the scene, a recording whose finding is its frame's
// heading. The systems by name and the three ways in come after the scene.
test.describe('the opening', () => {
  const scene = (page: Page) => page.getByRole('region', { name: /^Backspace in an empty field/ });

  test('says who it is for and what is measured, before the scene', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText('Choosing a component library, or building your own?'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Earshot measures what components expose to assistive technology.',
    );
  });

  test('at 1440 by 900 the finding and two recorded rows are in the first view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(scene(page).getByRole('heading', { level: 2 })).toBeInViewport({ ratio: 1 });
    const rows = scene(page).getByText(/^(Atlassian|MUI)\s/);
    await expect(rows).toHaveCount(2);
    for (const row of await rows.all()) await expect(row).toBeInViewport({ ratio: 1 });
  });

  test('the finding heads the frame: behaviour, rule and how many follow it', async ({ page }) => {
    await page.goto('/');
    await expect(scene(page).getByRole('heading', { level: 2 })).toHaveText(
      /^Backspace in an empty field: \d+ behaviors? in \d+ design systems?; \d+ with no modelled speech\.$/,
    );
    await expect(scene(page)).toContainText(/\d+ of \d+\s*follow/);
    await expect(
      scene(page).getByRole('link', { name: 'Backspace twice to remove' }),
    ).toHaveAttribute('href', '/patterns/input-with-chips/#rule-bsp');
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

  test('how the lines were made is said under the frame', async ({ page }) => {
    await page.goto('/');
    await expect(scene(page)).toContainText('Recorded by the Earshot engine in Chromium.');
    await expect(scene(page)).toContainText('not taken from a screen reader');
  });

  test('the systems by name and the ways in follow the scene', async ({ page }) => {
    await page.goto('/');
    const routes = page.getByRole('list', { name: 'Where to start' });
    await expect(routes.getByRole('link')).toHaveCount(3);
    await expect(page.getByText(/^Measured so far:/)).toBeVisible();
    const sceneBox = await scene(page).boundingBox();
    const routesBox = await routes.boundingBox();
    expect(routesBox?.y ?? 0).toBeGreaterThan((sceneBox?.y ?? 0) + (sceneBox?.height ?? 0) - 1);
  });

  test('at 390 px nothing scrolls sideways and the finding starts in the first view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await expect(scene(page).getByRole('heading', { level: 2 })).toBeInViewport();
  });
});
