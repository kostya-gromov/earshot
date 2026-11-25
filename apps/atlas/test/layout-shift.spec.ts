import { expect, test, type Page } from '@playwright/test';

const url = '/patterns/input-with-chips/';

// Design review 2026-11-11: replays and arriving speech moved the page under the reader (CLS 0.32
// at 390 px). Each changing part now holds the height of its tallest state.

const ready = (page: Page) => page.locator('[data-chip-field][data-ready="true"]').waitFor();

/** Total layout shift without recent input, from the page's own observer. */
async function shiftDuring(page: Page, act: () => Promise<void>): Promise<number> {
  await page.evaluate(() => {
    const store = window as unknown as { shift: number };
    store.shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[])
        if (!entry.hadRecentInput) store.shift += entry.value;
    }).observe({ type: 'layout-shift' });
  });
  await act();
  return page.evaluate(() => (window as unknown as { shift: number }).shift);
}

test('at 390 px the comparison replay never changes the page height', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await ready(page);
  await page.getByText('Compare with').scrollIntoViewIfNeeded();
  const heights = new Set<number>();
  const shift = await shiftDuring(page, async () => {
    for (let i = 0; i < 12; i += 1) {
      await page.waitForTimeout(500);
      heights.add(await page.evaluate(() => document.documentElement.scrollHeight));
    }
  });
  expect([...heights]).toHaveLength(1);
  expect(shift).toBeLessThan(0.05);
});

test('Watch it does not push the page down as speech arrives', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await ready(page);
  // In page coordinates: Watch it scrolls the field into view, which is not a shift.
  const belowTop = () =>
    page.evaluate(() => {
      const playground = document.querySelector('[aria-labelledby="playground-title"]')!;
      return playground.getBoundingClientRect().bottom + window.scrollY;
    });
  const before = await belowTop();
  await page.getByRole('button', { name: 'Watch it' }).click();
  await expect(page.getByTestId('live-reference').getByRole('status')).toHaveText(/removed/, {
    timeout: 6000,
  });
  await page.waitForTimeout(800);
  expect(await belowTop()).toBe(before);
});

// Design review 2026-11-12 (pass 2): the home example plays by itself while the reader scrolls,
// so its rows changing height counted as layout shift (0.13 to 0.16 at 390 px, reduced motion).
test('at 390 px the home example plays without moving the page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const scene = page.getByRole('region', { name: /^Backspace in an empty field/ });
  const shift = await shiftDuring(page, async () => {
    await scene.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 400);
    await expect(scene.getByRole('button', { name: /Press again/ })).toBeVisible();
    await page.waitForTimeout(600);
  });
  expect(shift).toBeLessThan(0.02);
});

// Design review 2026-11-11 (pass 2): at 390 px removing a chip unwrapped a row of the field and
// the page got 36 px shorter, long after the press. The field now holds its starting height.
test('at 390 px Watch it leaves the page the same height', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/patterns/input-with-chips/');
  await ready(page);
  const height = () => page.evaluate(() => document.documentElement.scrollHeight);
  const before = await height();
  await page
    .getByRole('region', { name: 'Try it' })
    .getByRole('button', { name: 'Watch it', exact: true })
    .click();
  await expect(page.getByTestId('live-reference').getByRole('status')).toHaveText(/removed/, {
    timeout: 6000,
  });
  await page.waitForTimeout(3000);
  expect(await height()).toBe(before);
});

// Design review 2026-11-13: at 390 px the system list sat under the recording, so choosing a
// system moved the tapped row by up to 243 px. The list now comes first and stays put.
test('at 390 px choosing a system inside a rule does not move the tapped row', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/patterns/input-with-chips/#ev-bsp-atlassian');
  const whose = page.locator('#rule-bsp').getByRole('group', { name: 'Whose recording' });
  await expect(whose.getByRole('button', { name: /Atlassian/ })).toBeFocused();
  for (const system of [/GitHub Primer/, /MUI/, /Reference/]) {
    const button = whose.getByRole('button', { name: system });
    await button.scrollIntoViewIfNeeded();
    const before = (await button.boundingBox())!.y + (await page.evaluate(() => window.scrollY));
    await button.click();
    await page.waitForTimeout(400);
    const after = (await button.boundingBox())!.y + (await page.evaluate(() => window.scrollY));
    expect(Math.abs(after - before)).toBeLessThan(2);
  }
});

// Design review 2026-11-13: the suggestions list opened in the flow and pushed the page down
// 157 px on the first letter typed. It now opens over what is below the field, right under it.
test('typing in the playground opens the suggestions without moving the page', async ({ page }) => {
  await page.goto('/patterns/input-with-chips/');
  await ready(page);
  const height = () => page.evaluate(() => document.documentElement.scrollHeight);
  const before = await height();
  const playground = page.getByRole('region', { name: 'Try it' });
  await playground.getByRole('combobox', { name: 'To' }).pressSequentially('ma');
  const list = playground.getByRole('listbox', { name: 'Suggestions' });
  await expect(list).toBeVisible();
  expect(await height()).toBe(before);
  const box = (await page.locator('.chip-field__box').boundingBox())!;
  const popup = (await list.boundingBox())!;
  expect(popup.y).toBeGreaterThanOrEqual(box.y + box.height);
});
