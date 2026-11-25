import { expect, test } from '@playwright/test';

/*
 * In forced colours the chosen scenario of "Compare with" still looks chosen. Its fill is a
 * background, which forced colours take away (design review, 2026-11-19, on every pattern page).
 * Judged on pixels, as the rule panel's "choice-marked" is: the leading edge of the chosen
 * button and of one that is not chosen must not be the same picture.
 */
const pages = [
  '/patterns/input-with-chips/',
  '/patterns/combobox/',
  '/patterns/menu-button/',
  '/patterns/tabs/',
] as const;

for (const path of pages) {
  test(`${path}: in forced colours the chosen scenario to replay looks chosen`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      forcedColors: 'active',
    });
    const page = await context.newPage();
    await page.goto(path);
    const group = page.getByRole('group', { name: 'Keys to replay' });
    await group.scrollIntoViewIfNeeded();
    const strips = [];
    for (const pressed of ['true', 'false']) {
      const button = group.locator(`button[aria-pressed="${pressed}"]`).first();
      const box = await button.boundingBox();
      if (!box) throw new Error(`no ${pressed} button to compare`);
      // The leading edge, clear of the words, which differ from button to button.
      const clip = { x: box.x, y: box.y + 4, width: 6, height: box.height - 8 };
      strips.push((await page.screenshot({ clip })).toString('base64'));
    }
    expect(strips[0], 'chosen and not chosen').not.toBe(strips[1]);
    await context.close();
  });
}

/*
 * In forced colours the Play/Pause button keeps an edge, as the keycaps beside it do: its edge
 * was a box-shadow, which forced colours take away (design review, 2026-11-24). Judged on pixels:
 * a strip on the button's leading edge must not look like the page just outside it.
 */
for (const where of ['rule panel', 'compare grid'] as const) {
  test(`in forced colours the Play/Pause button of the ${where} has an edge`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/patterns/combobox/');
    const scope =
      where === 'compare grid'
        ? page.getByRole('group', { name: 'Keys to replay' }).locator('xpath=..')
        : page.locator('[role="tabpanel"]').first();
    const button = scope.getByRole('button', { name: /^(Play|Pause)$/ }).first();
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    if (!box) throw new Error('no Play/Pause button');
    const strip = (x: number) =>
      page.screenshot({ clip: { x, y: box.y + 6, width: 2, height: box.height - 12 } });
    const edge = (await strip(box.x)).toString('base64');
    const outside = (await strip(box.x - 4)).toString('base64');
    expect(edge, 'edge and the page beside it').not.toBe(outside);
    await context.close();
  });
}
