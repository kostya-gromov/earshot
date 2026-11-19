import { expect, test, type Page } from '@playwright/test';

const url = '/patterns/input-with-chips/';
const lens = (page: Page) => page.locator('section[aria-labelledby="lens-title"]');
const tipButton = (page: Page) =>
  lens(page).getByRole('button', { name: 'About copying for Figma' });
const tip = (page: Page) => lens(page).getByRole('tooltip');

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(url);
  await page.getByRole('tab', { name: /For design/ }).click();
});

test('Copy for Figma copies one requirement with the page it is from', async ({ page }) => {
  const first = lens(page)
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading') })
    .first();
  const title = (await first.getByRole('heading').textContent())!.replace(/Guidance$/, '');
  // The visible label starts the name (WCAG 2.5.3); the requirement tells the buttons apart.
  await expect(first.getByRole('button', { name: /^Copy for Figma/ })).toHaveAccessibleName(
    `Copy for Figma: ${title}`,
  );
  await first.getByRole('button', { name: /^Copy for Figma/ }).click();
  await expect(first.getByRole('button', { name: /^Copied/ })).toBeVisible();
  await expect(first.getByRole('status')).toHaveText(
    `Copied “${title}”. Paste it into an annotation in Figma.`,
  );
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.split('\n')[0]).toContain(title);
  expect(copied).toMatch(
    /\n\nFrom Earshot Atlas: http:\/\/localhost:\d+\/patterns\/input-with-chips\/#lens$/,
  );
  // The button offers to copy again once it has said so.
  await expect(first.getByRole('button', { name: /^Copy for Figma/ })).toBeVisible({
    timeout: 4000,
  });
});

test('each requirement’s button has a name of its own', async ({ page }) => {
  const names = await lens(page)
    .getByRole('button', { name: /^Copy for Figma: / })
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
  expect(names.length).toBeGreaterThan(1);
  expect(new Set(names).size).toBe(names.length);
});

test('Copy all copies every requirement under one heading line', async ({ page }) => {
  const all = lens(page).getByRole('button', { name: /^Copy all \d+ for Figma$/ });
  const count = Number((await all.textContent())!.match(/\d+/)![0]);
  await all.click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const blocks = copied.split('\n\n');
  expect(blocks[0]).toBe('Accessibility requirements for the design: Input with chips');
  // The heading line, a block per requirement, and the line naming the page.
  expect(blocks).toHaveLength(count + 2);
});

test('the note is the description of its button, there before it is shown', async ({ page }) => {
  await expect(tipButton(page)).toHaveAccessibleDescription(/Ready-made annotations are planned/);
  await expect(tip(page)).toBeHidden();
});

test('focus shows the note, Escape hides it and leaves focus where it was', async ({ page }) => {
  await tipButton(page).focus();
  await expect(tip(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tip(page)).toBeHidden();
  await expect(tipButton(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(tip(page)).toBeHidden();
});

test('the pointer shows the note, and it stays while the pointer is over it', async ({ page }) => {
  await tipButton(page).hover();
  await expect(tip(page)).toBeVisible();
  // WCAG 1.4.13 hoverable: the pointer can move onto the note without losing it.
  await tip(page).hover();
  await expect(tip(page)).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tip(page)).toBeHidden();
});

test('at 390 px the shown note stays inside the window', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await tipButton(page).focus();
  await expect(tip(page)).toBeVisible();
  const box = (await tip(page).boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

// Design review 2026-11-18: "Copied" narrowed the button and moved its left edge.
test('a copy button keeps its width when it says Copied', async ({ page }) => {
  const all = lens(page).getByRole('button', { name: /^Copy all \d+ for Figma$/ });
  const before = (await all.boundingBox())!;
  await all.click();
  await expect(lens(page).getByRole('button', { name: 'Copied' })).toBeVisible();
  const after = (await lens(page).getByRole('button', { name: 'Copied' }).boundingBox())!;
  expect(after.width).toBeCloseTo(before.width, 0);
  expect(after.x).toBeCloseTo(before.x, 0);
});

// Design review 2026-11-19: the quiet button has no box, so its text is its shape; "Copied",
// centred, ended 25 px short of the edge the sources line up on.
test('a requirement’s Copied keeps the edge its label sat on', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const first = lens(page)
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading') })
    .first();
  const shownEdge = () =>
    first
      .getByRole('button', { name: /^(Copy for Figma|Copied)/ })
      .locator('[data-shown]')
      .evaluate((label) => {
        // The text's own box: the label stretches over its cell, the text sits inside it.
        const range = document.createRange();
        range.selectNodeContents(label);
        return range.getBoundingClientRect().right;
      });
  const before = await shownEdge();
  await first.getByRole('button', { name: /^Copy for Figma/ }).click();
  await expect(first.getByRole('button', { name: /^Copied/ })).toBeVisible();
  expect(await shownEdge()).toBeCloseTo(before, 0);
});
