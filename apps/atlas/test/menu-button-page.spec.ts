import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The menu button page. It was built and reviewed on a preview route and moved to the patterns
// on 2026-11-16. Tested here, among its own behaviour, is what its data must never do: count a
// variant, or show a recorded note with no file.
test.beforeEach(async ({ page }) => {
  await page.goto('/patterns/menu-button/');
});

test('the page is one of the patterns, and nothing is left at the preview address', async ({
  page,
}) => {
  await expect(page.getByText('Preview, not published.')).toHaveCount(0);
  const kicker = page
    .locator('main p')
    .filter({ hasText: /^Pattern/ })
    .first();
  await expect(kicker).toContainText('3 of 6');
  await expect(page.getByRole('link', { name: 'Patterns', exact: true })).toHaveAttribute(
    'href',
    '/patterns/',
  );
  await page.goto('/patterns/');
  await expect(
    page.getByRole('main').locator('a[href="/patterns/menu-button/"]').first(),
  ).toBeVisible();
  const old = await page.goto('/lab/patterns/menu-button/');
  expect(old?.status()).toBe(404);
});

test('a variant of a system is not a column of the matrix', async ({ page }) => {
  const systems = page.getByRole('columnheader');
  await expect(systems).toHaveCount(6);
  await expect(systems.filter({ hasText: 'Fluent 2' })).toHaveCount(1);
});

test('a note recorded on a variant shows that recording’s provenance and its file', async ({
  page,
}) => {
  await page
    .getByRole('tab', { name: /Expanded says/ })
    .first()
    .click();
  await page
    .getByRole('button', { name: /Fluent 2/ })
    .last()
    .click();
  const note = page
    .getByRole('listitem')
    .filter({ hasText: 'With the Default story’s plain Button' })
    .filter({ visible: true });
  await expect(note).toContainText(
    'Recorded by the engine on another page of this system, not counted',
  );
  // Its own line: version, browser, engine and date, as on every measured card.
  await expect(note).toContainText(
    /Fluent 2 9\.75\.2, Chromium [\d.]+ on macOS, engine \d+\.\d+\.\d+, 25 Nov 2026\./,
  );
  const link = note.getByRole('link', { name: 'Raw JSON of this recording' });
  const response = await page.request.get((await link.getAttribute('href')) ?? '');
  expect(response.ok()).toBe(true);
  // The file is the variant's own: the page with the plain Button, where the rule differs.
  const raw = (await response.json()) as {
    target: { adapter: string };
    verdicts: { expanded: { verdict: string } };
  };
  expect(raw.target.adapter).toBe('fluent-default-story');
  expect(raw.verdicts.expanded.verdict).toBe('differs');
});

// Design review 2026-11-16: the same notes about a system stood under each of the nine rules.
test('a note about a system is shown under the rules it concerns, not under every rule', async ({
  page,
}) => {
  const panel = page.locator('[role="tabpanel"][id^="rule-"]:not([hidden])');
  const skipped = 'The arrow keys skip the disabled item';
  await page
    .getByRole('tab', { name: /A disabled item can be reached/ })
    .first()
    .click();
  await panel.locator('[data-system="mui"]').click();
  await expect(panel.getByText(skipped)).toBeVisible();
  await page
    .getByRole('tab', { name: /Enter and Space open the menu/ })
    .first()
    .click();
  await panel.locator('[data-system="mui"]').click();
  await expect(panel.getByText(skipped)).toHaveCount(0);
  // A note that names no rule is about the component whatever the rule, and stays.
  await expect(panel.getByText('its name in the accessibility tree is “ACTIONS”')).toBeVisible();
});

const playground = (page: Page) => page.locator('section[aria-labelledby="playground-title"]');
const transcript = (page: Page) => playground(page).getByRole('log', { name: 'Transcript' });

/** The reference is running: its module has loaded and its items are in the menu. */
async function focusButton(page: Page) {
  const stage = page.getByTestId('live-reference');
  await stage.locator('[data-ready="true"]').waitFor();
  await stage.getByRole('button', { name: 'Actions' }).focus();
  return stage;
}

test('the playground invites the first key where it is pressed', async ({ page }) => {
  // Before focus lands anywhere: the invitation gives way to the first spoken line.
  await page.getByTestId('live-reference').locator('[data-ready="true"]').waitFor();
  await expect(playground(page)).toContainText('Press Enter on the button');
  // The reference has no live region, so the legend names one kind of line only.
  await expect(playground(page).getByRole('list', { name: 'Legend' })).not.toContainText(
    'Live region message',
  );
});

test('real keys open the menu, reach the disabled item and run an action', async ({ page }) => {
  const stage = await focusButton(page);
  const line = stage.locator('[data-last-action]');
  await page.keyboard.press('Enter');
  await expect(transcript(page)).toContainText('Rename, menuitem, 1 of 4');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(transcript(page)).toContainText('Archive, menuitem, 3 of 4, unavailable');
  // Enter on the disabled item runs nothing and the menu stays.
  await page.keyboard.press('Enter');
  await expect(line).toHaveText('Last action: none');
  await expect(stage.getByRole('menu')).toBeVisible();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(line).toHaveText('Last action: Duplicate');
  await expect(stage.getByRole('menu')).toBeHidden();
  await expect(stage.getByRole('button', { name: 'Actions' })).toBeFocused();
});

test('the tour marks a rule only when the person has performed it', async ({ page }) => {
  await focusButton(page);
  const tried = page.getByText(/^\d of 4 tried$/);
  await expect(tried).toHaveText('0 of 4 tried');
  await page.keyboard.press('Enter');
  await expect(tried).toHaveText('1 of 4 tried');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await expect(tried).toHaveText('2 of 4 tried');
  await page.keyboard.press('Escape');
  await expect(tried).toHaveText('3 of 4 tried');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(tried).toHaveText('4 of 4 tried');
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the page has no axe violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.reload();
    await focusButton(page);
    await page.keyboard.press('Enter');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('“Compare with” replays the picked systems side by side as menus', async ({ page }) => {
  const compare = page
    .getByRole('group', { name: /Compare/ })
    .or(page.getByText('Compare with').locator('..'));
  await expect(compare.first()).toBeVisible();
  // Each lane is a system's recording of the same keys; the page's own words stand beside it.
  await expect(page.getByText('To the disabled item').first()).toBeVisible();
  await expect(
    page.getByText(/Focus on “Archive”, 3 of 4, disabled|Focus on “Delete”, 4 of 4/).first(),
  ).toBeAttached();
});

test('the item under the pointer never looks like the item that has focus', async ({ page }) => {
  const stage = await focusButton(page);
  await page.keyboard.press('Enter');
  const look = (name: string) =>
    stage.getByRole('menuitem', { name }).evaluate((item) => {
      const { backgroundColor, outlineStyle, outlineWidth } = getComputedStyle(item);
      return { backgroundColor, outline: `${outlineStyle} ${outlineWidth}` };
    });
  await stage.getByRole('menuitem', { name: 'Delete' }).hover();
  // Let the 120 ms fade settle before reading colours.
  await page.waitForTimeout(250);
  const [focused, hovered, plain] = await Promise.all([
    look('Rename'),
    look('Delete'),
    look('Duplicate'),
  ]);
  // Hover answers: a fill the plain item does not have. Focus is stronger: its own tint and an
  // outline, which hover never gets.
  expect(hovered.backgroundColor).not.toBe(plain.backgroundColor);
  expect(hovered.backgroundColor).not.toBe(focused.backgroundColor);
  expect(focused.outline).toBe('solid 2px');
  expect(hovered.outline).not.toBe('solid 2px');
  // A disabled item does not answer the pointer: a click on it would do nothing.
  await stage.getByRole('menuitem', { name: 'Archive' }).hover();
  await page.waitForTimeout(250);
  expect((await look('Archive')).backgroundColor).toBe(plain.backgroundColor);
});

test('scenarios that say the same are folded behind a button that opens by keyboard', async ({
  page,
}) => {
  await page
    .getByRole('tab', { name: /Expanded says/ })
    .first()
    .click();
  const list = page
    .getByRole('list', { name: 'Reference: the scenarios behind this verdict' })
    .filter({ visible: true });
  // The scenario that decided the verdict is a row of its own, never inside a fold.
  await expect(list.getByText('Decided the verdict')).toBeVisible();
  const fold = list.getByRole('button', {
    name: /^7 more scenarios, same result, \d+ steps judged$/,
  });
  await expect(fold).toHaveAttribute('aria-expanded', 'false');
  await expect(list.getByRole('button', { name: /Escape with the menu shown/ })).toBeHidden();
  await fold.focus();
  await page.keyboard.press('Enter');
  await expect(fold).toHaveAttribute('aria-expanded', 'true');
  // Opened, every folded scenario is there.
  const escape = list.getByRole('button', { name: /Escape with the menu shown/ });
  await expect(escape).toBeVisible();
  // What they share is said once; each row says only what sets it apart, from the file.
  await expect(list.getByText('Expanded matches the menu').last()).toBeVisible();
  await expect(escape).toHaveText(/Escape with the menu shown · \d+ steps judged$/);
  // Choosing one replays it; the fold stays open with the chosen scenario in it.
  await escape.click();
  await expect(escape).toHaveAttribute('aria-pressed', 'true');
  await expect(fold).toHaveAttribute('aria-expanded', 'true');
  // Closing the fold does not change what the person is watching: their scenario stays in the
  // list, under the closed button, which now counts the others.
  await fold.click();
  const closed = list.getByRole('button', { name: /^6 more scenarios, same result/ });
  await expect(closed).toHaveAttribute('aria-expanded', 'false');
  await expect(escape).toBeVisible();
  await expect(escape).toHaveAttribute('aria-pressed', 'true');
  // The choice is the person's own, so it is kept for another system, whose folds are its own.
  const panel = page.locator('[role="tabpanel"][id^="rule-"]:not([hidden])');
  await panel.locator('button', { hasText: 'Fluent 2' }).last().click();
  const other = page
    .getByRole('list', { name: 'Fluent 2: the scenarios behind this verdict' })
    .filter({ visible: true });
  await expect(other.getByRole('button', { pressed: true })).toContainText(
    'Escape with the menu shown',
  );
  // The scenario that decided this system's verdict is still marked as such.
  await expect(other.getByText('Decided the verdict')).toBeVisible();
  for (const button of await other.getByRole('button', { name: /more scenarios?/ }).all()) {
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  }
});

test('the replay stays in view while a scenario far down the list is chosen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page
    .getByRole('tab', { name: /Expanded says/ })
    .first()
    .click();
  const list = page
    .getByRole('list', { name: 'Reference: the scenarios behind this verdict' })
    .filter({ visible: true });
  for (const fold of await list.getByRole('button', { name: /more scenarios?/ }).all()) {
    await fold.click();
  }
  const last = list.getByRole('button', { name: /A letter typed in the menu/ });
  await last.scrollIntoViewIfNeeded();
  await last.click();
  // The row chosen keeps focus, and the recording it started is on screen with it.
  await expect(last).toBeFocused();
  const pause = page
    .locator('[role="tabpanel"][id^="rule-"]:not([hidden])')
    .getByRole('button', { name: /^(Pause|Play)$/ });
  await expect(pause).toBeInViewport();
});

test('keyboard focus is never under the recording that stays at the top', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page
    .getByRole('tab', { name: /Expanded says/ })
    .first()
    .click();
  const panel = page.locator('[role="tabpanel"][id^="rule-"]:not([hidden])');
  const list = page
    .getByRole('list', { name: 'Reference: the scenarios behind this verdict' })
    .filter({ visible: true });
  for (const fold of await list.getByRole('button', { name: /more scenarios?/ }).all()) {
    await fold.click();
  }
  // From the last row back up to the first, as Shift+Tab goes: each stop must be seen whole,
  // below the recording (WCAG 2.4.11, Focus Not Obscured).
  const stops = list.getByRole('button').filter({ visible: true });
  await stops.last().focus();
  const count = await stops.count();
  for (let stop = 0; stop < count; stop += 1) {
    const hidden = await panel.evaluate((root) => {
      const scene = root.querySelector('[class*="scene"]');
      const focused = document.activeElement;
      if (!scene || !focused) return 'nothing to compare';
      const bottom = scene.getBoundingClientRect().bottom;
      const { top } = focused.getBoundingClientRect();
      return top < bottom - 1 ? `${focused.textContent?.slice(0, 40)}: ${top} < ${bottom}` : '';
    });
    expect(hidden).toBe('');
    await page.keyboard.press('Shift+Tab');
  }
});
