import { expect, test, type Page } from '@playwright/test';

const url = '/patterns/input-with-chips/';

test.beforeEach(async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-chip-field][data-ready="true"]').waitFor();
});

test('the live reference follows the Backspace rule and announces the removal', async ({
  page,
}) => {
  const playground = page.getByRole('region', { name: 'Try it' });
  await playground.getByRole('combobox', { name: 'To' }).focus();
  await page.keyboard.press('Backspace');
  await expect(playground.getByRole('button', { name: 'Remove Hiroshi Matsui' })).toBeFocused();
  await page.keyboard.press('Backspace');
  await expect(page.getByTestId('live-reference').getByRole('status')).toHaveText(
    'Hiroshi Matsui removed. 2 selected',
  );
  await expect(playground.getByRole('button', { name: 'Remove Greg Fisher' })).toBeFocused();
});

test('the playground runs the reference JavaScript produced from its TypeScript', async ({
  request,
}) => {
  const response = await request.get('/reference/input-with-chips/chip-field.js');
  expect(response.headers()['content-type']).toContain('text/javascript');
  const code = await response.text();
  expect(code).toContain('export function createChipField');
  // Types are stripped: no annotations survive into what the browser runs.
  expect(code).not.toMatch(/\): \{ destroy: \(\) => void \}/);
});

test.describe('transcript', () => {
  const transcript = (page: Page) => page.getByRole('log', { name: 'Transcript' });

  // Design review 2026-11-15: lines the field beside them did not cause read as a contradiction
  // (a removal said next to three chips), so at rest there is only the way in.
  test('at rest nothing is said and no key is shown: only the way in', async ({ page }) => {
    await expect(transcript(page)).toHaveText('');
    await expect(page.getByText('Press Backspace in the field', { exact: true })).toBeVisible();
    await expect(page.getByText(/Recorded by the engine/)).toHaveCount(0);
  });

  test('the first key brings the first line: what the live field says', async ({ page }) => {
    await page.getByRole('combobox', { name: 'To' }).focus();
    await page.keyboard.press('Backspace');
    await expect(page.getByText('Press Backspace in the field', { exact: true })).toHaveCount(0);
    await expect(transcript(page).locator('q').last()).toHaveText(
      'Remove Hiroshi Matsui, button, 3 of 3',
    );
    await page.keyboard.press('Backspace');
    await expect(transcript(page).locator('q').last()).toHaveText(
      'Hiroshi Matsui removed. 2 selected',
    );
  });

  test('Reset brings back three chips and an empty transcript', async ({ page }) => {
    await page.getByRole('combobox', { name: 'To' }).focus();
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.locator('[data-chip-field][data-ready="true"]').waitFor();
    await expect(page.getByTestId('live-reference').getByRole('listitem')).toHaveCount(3);
    // The way in is not speech: it stands outside the transcript, in the interface typeface.
    await expect(transcript(page)).toHaveText('');
    const prompt = page.getByText('Press Backspace in the field', { exact: true });
    await expect(prompt).toBeVisible();
    expect(await prompt.evaluate((p) => getComputedStyle(p).fontStyle)).toBe('normal');
  });

  test('Watch it turns into Stop while it plays, and Stop ends it where it is', async ({
    page,
  }) => {
    const playground = page.getByRole('region', { name: 'Try it' });
    await playground.getByRole('button', { name: 'Watch it', exact: true }).click();
    const stop = playground.getByRole('button', { name: 'Stop', exact: true });
    await expect(stop).toBeVisible();
    await stop.click();
    await expect(playground.getByRole('button', { name: 'Watch it', exact: true })).toBeVisible();
    const keysSoFar = await transcript(page).textContent();
    await page.waitForTimeout(1500);
    await expect(transcript(page)).toHaveText(keysSoFar ?? '');
  });

  test('Watch it plays the keys through the component itself', async ({ page }) => {
    await page.getByRole('button', { name: 'Watch it' }).click();
    await expect(transcript(page)).toContainText('Hiroshi Matsui removed. 2 selected', {
      timeout: 6000,
    });
  });
});

// Design review 2026-11-13: "Replay in playground" jumped to the top of the page and left the
// reader thousands of pixels from the rule, with no way back.
test('a replay started from a rule offers the way back to it', async ({ page }) => {
  await page.getByRole('tablist', { name: 'Rules' }).locator('#tab-bsp').click();
  const replay = page.locator('#rule-bsp').getByRole('button', { name: 'Replay in playground' });
  await replay.click();
  const playground = page.getByRole('region', { name: 'Try it' });
  const back = playground.getByRole('button', { name: 'Back to the recording' });
  await expect(back).toBeVisible();
  await expect(playground).toBeInViewport();
  await back.click();
  await expect(replay).toBeFocused();
  await expect(replay).toBeInViewport();
  await expect(back).toHaveCount(0);
});

test('Watch it from the playground itself offers no way back, there is nowhere to go', async ({
  page,
}) => {
  const playground = page.getByRole('region', { name: 'Try it' });
  await playground.getByRole('button', { name: 'Watch it', exact: true }).click();
  await expect(playground.getByRole('button', { name: 'Back to the recording' })).toHaveCount(0);
});
