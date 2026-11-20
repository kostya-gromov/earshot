import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// The tabs page. It was built and reviewed on a preview route and moved to the patterns on
// 2026-11-19, on the owner's word after his VoiceOver check.
test.beforeEach(async ({ page }) => {
  await page.goto('/patterns/tabs/');
});

test('the page is one of the patterns, and nothing is left at the preview address', async ({
  page,
}) => {
  await expect(page.getByText('Preview, not published.')).toHaveCount(0);
  const kicker = page
    .locator('main p')
    .filter({ hasText: /^Pattern/ })
    .first();
  await expect(kicker).toContainText('4 of 4');
  await page.goto('/');
  await expect(page.getByRole('main').locator('a[href="/patterns/tabs/"]').first()).toBeVisible();
  const old = await page.goto('/lab/patterns/tabs/');
  expect(old?.status()).toBe(404);
});

test('the playground runs the reference and its tour counts real keys', async ({ page }) => {
  // The reference starts after its module loads: keys pressed before that reach no handler.
  const playground = page.locator('[data-tabs][data-ready="true"]').first();
  await playground.waitFor();
  await playground.getByRole('tab', { name: 'Overview', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(playground.getByRole('tab', { name: 'Activity', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(playground.getByRole('tab', { name: 'Settings', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByText('3 of 3 tried')).toBeVisible();
  // The panel is named by its tab, as the engine hears it from the tree.
  await expect(page.getByText('Settings, tabpanel').first()).toBeVisible();
});

test('the systems that were measured are the columns of the matrix', async ({ page }) => {
  const systems = page.getByRole('columnheader');
  await expect(systems).toHaveCount(5);
  await expect(systems.filter({ hasText: 'Atlassian' })).toHaveCount(1);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no axe violations in the ${colorScheme} theme`, async ({ page }) => {
    // Replays crossfade their words; contrast is judged on the settled page, not mid-fade.
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/patterns/tabs/');
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.timeline === document.timeline)
          .map((a) => a.finished.catch(() => undefined)),
      ),
    );
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('the page does not scroll sideways on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/patterns/tabs/');
  await page.locator('[data-tabs][data-ready="true"]').first().waitFor();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});

// The playground hosts the reference's tabs: the ring the reference draws 4 px around a focused
// tab must not be cut by the card (design review, 2026-11-19, second pass). Judged on pixels: the
// 4 px beside the first tab's left edge and the last tab's right edge change when it has focus.
for (const width of [390, 1440]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`the playground draws the whole focus ring at the ends, ${width} ${colorScheme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/patterns/tabs/');
      const playground = page.locator('[data-tabs][data-ready="true"]').first();
      await playground.waitFor();
      for (const [name, side] of [
        ['Overview', 'left'],
        ['Settings', 'right'],
      ] as const) {
        const tab = playground.getByRole('tab', { name, exact: true });
        await tab.scrollIntoViewIfNeeded();
        const box = (await tab.boundingBox())!;
        const x = side === 'left' ? box.x - 4 : box.x + box.width;
        const clip = { x, y: box.y + 6, width: 4, height: box.height - 12 };
        const rest = await page.screenshot({ clip });
        await tab.focus();
        await page.keyboard.press('Shift');
        const focused = await page.screenshot({ clip });
        expect(Buffer.compare(rest, focused), `${name}: ring beside its ${side} edge`).not.toBe(0);
        await tab.blur();
      }
    });
  }
}

// The reference focuses a tab and then selects it. The spoken line is composed after the key's
// handler has finished, as the engine reads it after the step: with "selected" (design review,
// 2026-11-20: the line was read at the moment focus landed and left it out).
test('the spoken line of a tab reached by arrow says it is selected', async ({ page }) => {
  const playground = page.locator('[data-tabs][data-ready="true"]').first();
  await playground.waitFor();
  await playground.getByRole('tab', { name: 'Overview', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('Activity, tab, 2 of 4, selected').first()).toBeVisible();
});
