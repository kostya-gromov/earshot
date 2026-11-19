import { expect, test, type Locator, type Page } from '@playwright/test';

// The combobox playground: the reference running live on the pattern page, what it would say,
// and a tour that only real keys complete.
const url = '/patterns/combobox/';
const live = (page: Page) => page.getByTestId('live-reference');
const input = (page: Page) => live(page).getByRole('combobox', { name: 'Fruit' });
const transcript = (page: Page) => page.getByRole('log', { name: 'Transcript' });
const ruleset = (page: Page) => page.getByRole('region', { name: 'Try each rule' });
const step = (page: Page, rule: string) => ruleset(page).locator(`[data-rule="${rule}"]`);

/** Where an element starts on the page, whatever the scroll position: focusing may scroll. */
const topOnPage = (locator: Locator) =>
  locator.evaluate((element) => Math.round(element.getBoundingClientRect().top + scrollY));

// The open rule; the lenses further down are tab panels too.
const rulePanel = (page: Page) => page.locator('[role="tabpanel"][id^="rule-"]:not([hidden])');

test.beforeEach(async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-combobox][data-ready="true"]').waitFor();
});

test('the playground runs the reference: typing narrows the list and says how many', async ({
  page,
}) => {
  await input(page).focus();
  await page.keyboard.type('a');
  await expect(live(page).getByRole('option')).toHaveText(['Apple', 'Apricot', 'Avocado']);
  await expect(transcript(page)).toContainText('3 suggestions');
});

test('the active option is said in the engine’s words, and focus stays in the field', async ({
  page,
}) => {
  await input(page).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  // Two keys with no frame between them are still two lines, each with its own option.
  await expect(transcript(page)).toContainText(
    'Apple, option, 1 of 6, selectedApricot, option, 2 of 6, selected',
  );
  await expect(input(page)).toBeFocused();
});

test('at rest nothing is said and no key is shown: only the way in', async ({ page }) => {
  await expect(transcript(page)).toHaveText('');
  await expect(page.getByText('Press Down Arrow in the field', { exact: true })).toBeVisible();
});

test('the open list stays inside the playground and moves nothing on the page', async ({
  page,
}) => {
  const playground = page.locator('section', {
    has: page.getByRole('heading', { name: 'Try it' }),
  });
  const before = await topOnPage(ruleset(page));
  await input(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(live(page).getByRole('option')).toHaveCount(6);
  const list = (await live(page).getByRole('listbox').boundingBox())!;
  const box = (await playground.boundingBox())!;
  expect(list.y + list.height).toBeLessThanOrEqual(box.y + box.height);
  expect(await topOnPage(ruleset(page))).toBe(before);
});

test('on a phone the list opens over what is below it and leaves the spoken line clear', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const before = await topOnPage(ruleset(page));
  await input(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(live(page).getByRole('option')).toHaveCount(6);
  expect(await topOnPage(ruleset(page))).toBe(before);
  const list = (await live(page).getByRole('listbox').boundingBox())!;
  const spoken = (await transcript(page).locator('q').last().boundingBox())!;
  expect(list.y + list.height).toBeLessThanOrEqual(spoken.y);
});

test('Watch it stops at the person’s first key: the field is theirs', async ({ page }) => {
  await page.getByRole('button', { name: 'Watch it' }).click();
  await expect(input(page)).toHaveValue('a', { timeout: 4000 });
  await page.keyboard.press('b');
  await expect(page.getByRole('button', { name: 'Watch it' })).toBeVisible();
  // The trail is the person's from here: the replay's keys are gone from it.
  await expect(page.locator('[class*="trail"] kbd')).toHaveText(['b']);
  // Nothing more is sent after the take-over: no Enter turns the text into an option.
  await page.waitForTimeout(2500);
  await expect(input(page)).toHaveValue('ab');
});

test('after a key that is followed by no speech, no line is current and that is said', async ({
  page,
}) => {
  await input(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(transcript(page).locator('q').last()).not.toHaveAttribute('data-past', 'true');
  await page.keyboard.press('Enter');
  await expect(transcript(page).getByText('Nothing said', { exact: true })).toBeVisible();
  await expect(transcript(page).locator('q').last()).toHaveAttribute('data-past', 'true');
  // The next thing said is current again, and the note is gone.
  await page.keyboard.press('ArrowDown');
  await expect(transcript(page).getByText('Nothing said')).toHaveCount(0);
});

test('Tab out of the field is not silence: the next control speaks', async ({ page }) => {
  await input(page).focus();
  await page.keyboard.press('Tab');
  await page.waitForTimeout(600);
  await expect(transcript(page).getByText('Nothing said')).toHaveCount(0);
});

test('at desktop width the keys stand under the field, not in the speech', async ({ page }) => {
  await input(page).focus();
  await page.keyboard.press('ArrowDown');
  const key = (await page.locator('[class*="trail"] kbd').first().boundingBox())!;
  const field = (await input(page).boundingBox())!;
  const heard = (await page.getByText('You would hear').boundingBox())!;
  expect(key.y).toBeGreaterThan(field.y + field.height);
  expect(key.x + key.width).toBeLessThanOrEqual(heard.x);
});

test.describe('tour', () => {
  test('Down Arrow in the closed field completes its rule and lights it', async ({ page }) => {
    await input(page).focus();
    await page.keyboard.press('ArrowDown');
    await expect(step(page, 'down')).toHaveAttribute('data-lit', 'true');
    await expect(step(page, 'down').locator('[data-done]')).toBeVisible();
    await expect(ruleset(page).getByRole('status')).toHaveText(
      'Tried: Down Arrow goes to an option. 1 of 4.',
    );
  });

  test('arrows complete after a move down the list and back up', async ({ page }) => {
    await input(page).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(step(page, 'arrows').locator('[data-done]')).toHaveCount(0);
    await page.keyboard.press('ArrowUp');
    await expect(step(page, 'arrows').locator('[data-done]')).toBeVisible();
  });

  test('Enter on an option completes its rule and fills the field', async ({ page }) => {
    await input(page).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input(page)).toHaveValue('Apple');
    await expect(step(page, 'enter').locator('[data-done]')).toBeVisible();
  });

  test('typing completes "say" when the number of suggestions is announced', async ({ page }) => {
    await input(page).focus();
    await page.keyboard.type('a');
    await expect(step(page, 'say-results').locator('[data-done]')).toBeVisible();
    await expect(step(page, 'say-results')).toHaveAttribute('data-heard', 'true');
  });

  test('Reset starts the tour afresh with the field', async ({ page }) => {
    await input(page).focus();
    await page.keyboard.press('ArrowDown');
    await expect(ruleset(page).getByText('1 of 4', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(ruleset(page).getByText('0 of 4', { exact: true })).toBeVisible();
  });

  test('every step links to its rule further down the page', async ({ page }) => {
    for (const rule of ['down', 'arrows', 'enter', 'say-results']) {
      await expect(step(page, rule).getByRole('link')).toHaveAttribute('href', `#rule-${rule}`);
      await expect(page.locator(`[id="rule-${rule}"]`)).toHaveCount(1);
    }
  });

  test('Watch it types and presses through the component, and never completes the tour', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Watch it' }).click();
    await expect(input(page)).toHaveValue('Apple', { timeout: 8000 });
    await expect(transcript(page)).toContainText('Apple, option, 1 of 3, selected');
    await expect(ruleset(page).getByText('0 of 4', { exact: true })).toBeVisible();
  });
});

test('a recording with typed text is replayed in the playground from its rule', async ({
  page,
}) => {
  await page.getByRole('tab', { name: /Enter accepts the active option/ }).click();
  await rulePanel(page).getByRole('button', { name: 'Replay in playground' }).click();
  await expect(input(page)).toHaveValue('Apple', { timeout: 8000 });
  await expect(page.getByRole('button', { name: 'Back to the recording' })).toBeVisible();
});
