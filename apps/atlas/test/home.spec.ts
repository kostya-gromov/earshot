import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`home has no axe violations in the ${colorScheme} theme`, async ({ page }) => {
    // Contrast is judged on the settled page: with reduced motion the schematic rests on its last
    // step and nothing is mid-animation. The animated states use the same colours.
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

const catalogue = (page: Page) => page.getByRole('region', { name: /^Patterns\./ });

test('lists a measured pattern with its counts and links to it', async ({ page }) => {
  await page.goto('/');
  const card = catalogue(page)
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: 'Menu button' }) });
  await expect(card).toContainText('Measured');
  await expect(card).toContainText('9 rules, 6 systems counted.');
  await card.getByRole('link', { name: 'Menu button' }).click();
  await expect(page).toHaveURL(/\/patterns\/menu-button\/$/);
});

test('the home page does not scroll sideways on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

// With five patterns the list was two to four screens long and grew with each one (design review
// 2026-11-23, the owner's decision the same day): the home page shows the three added last,
// newest first, and leads to all of them.
test('the three patterns added last are listed, newest first, with the way to all', async ({
  page,
}) => {
  await page.goto('/');
  await expect(catalogue(page).getByRole('listitem').getByRole('heading')).toHaveText([
    'Modal dialog',
    'Tabs',
    'Menu button',
  ]);
  await expect(page.getByText('In progress')).toHaveCount(0);
  await catalogue(page).getByRole('link', { name: 'View all 5 patterns' }).click();
  await expect(page).toHaveURL(/\/patterns\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Patterns');
});

test('the breadcrumb and brand lead home from any page', async ({ page }) => {
  await page.goto('/methodology/');
  await page.getByRole('link', { name: 'Atlas', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'How should an interactive component behave?',
  );
});

// Design review 2026-11-12: the opening's scene is a real recording, not a drawn schematic of a
// pattern Atlas has not measured, and the page has one pause control, not three.
test('the opening shows the recorded example and no drawn schematic', async ({ page }) => {
  await page.goto('/');
  const opening = page.getByRole('region', { name: /^How should an interactive component/ });
  await expect(opening.getByRole('region', { name: /These fields look the same/ })).toBeVisible();
  await expect(page.getByText('A schematic, not recorded data.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^(Pause|Play)/ })).toHaveCount(0);
});

test('under reduced motion the example shows every system’s result at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const scene = page.getByRole('region', { name: /These fields look the same/ });
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toContainText('Recorded by the Atlas engine in Chromium');
  await expect(scene.getByText('Waiting for Backspace').filter({ visible: true })).toHaveCount(0);
  // Five systems, five behaviours of one key: at least one removes a chip, one does not.
  await expect(scene).toContainText('Nothing changed in the accessibility tree');
});

test('says plainly that Atlas is guidance on the standards, not certification', async ({
  page,
}) => {
  await page.goto('/');
  const guidance = page.getByRole('region', { name: 'Guidance, not certification.' });
  await expect(guidance.getByRole('heading', { level: 2 })).toHaveText(
    'Guidance, not certification.',
  );
  for (const point of [
    'Advice, not a conformance claim',
    'A semantic model, not a screen reader',
    'Open to correction',
  ]) {
    await expect(guidance.getByRole('heading', { level: 3, name: point })).toBeVisible();
  }
  await expect(guidance.getByRole('link', { name: 'Read the methodology' })).toHaveAttribute(
    'href',
    '/methodology/',
  );
  // The method says where Atlas goes further than the standards.
  await expect(page.getByRole('region', { name: /^Rules, recordings, verdicts/ })).toContainText(
    'the rule is marked as a recommendation',
  );
});

test('the footer lists every pattern, the standards and how Atlas works', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Input with chips' })).toHaveAttribute(
    'href',
    '/patterns/input-with-chips/',
  );
  await expect(footer.getByRole('link', { name: 'WAI-ARIA Authoring Practices' })).toHaveAttribute(
    'href',
    'https://www.w3.org/WAI/ARIA/apg/',
  );
  // Said once, by the page's own honesty band, not again in the footer.
  await expect(footer).not.toContainText('not a conformance audit');
});

// WCAG 2.2.2: motion that starts by itself and lasts over five seconds needs a pause. Found
// 2026-11-11: about twenty looping animations and no control. Design review 2026-11-12: the
// figures now play once when seen, within five seconds, and rest; no pause control is needed.
test('what plays by itself ends by itself, except the measured scene', async ({ page }) => {
  await page.goto('/');
  // Since 2026-11-13 the pattern drawing is still: it played a sequence no recording shows.
  // Since 2026-11-14 the three recording figures each play one short run when first seen
  // (apps/atlas/CLAUDE.md, Motion: Illustration), in turn, and then rest.
  const method = page.getByRole('region', { name: /^Rules, recordings, verdicts/ });
  await method.getByText(/steps recorded/).scrollIntoViewIfNeeded();
  await expect(method.locator('[data-play]').first()).toBeVisible();
  await page.getByRole('region', { name: /^Patterns\./ }).scrollIntoViewIfNeeded();
  await expect(method.locator('[data-play]')).toHaveCount(0, { timeout: 5000 });
  const running = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => {
        const target = (a.effect as KeyframeEffect | null)?.target;
        return a.playState === 'running' && target?.closest('#how svg, #patterns svg');
      }).length,
  );
  expect(running).toBe(0);
});

// Design review 2026-11-13: schematic plates after a real recording went from showing to
// telling. Since 2026-11-13 the method speaks for every pattern: each step shows what it has
// produced so far, counted from the measurement files, not one key of one pattern.
test('the method is shown with totals counted from the measurements', async ({ page }) => {
  await page.goto('/');
  const method = page.getByRole('region', { name: /^Rules, recordings, verdicts/ });
  const steps = method
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) });
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toContainText(/\d+ rules/);
  await expect(steps.nth(0)).toContainText('Atlas recommendations');
  // "Written from the standards" is shown as the pages themselves, linked to their source.
  await expect(steps.nth(0).getByRole('link', { name: 'Focus Order' })).toHaveAttribute(
    'href',
    'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
  );
  await expect(steps.nth(1)).toContainText(/\d+ steps recorded/);
  await expect(steps.nth(1)).toContainText('Focus moved');
  await expect(steps.nth(2)).toContainText(/\d+ verdicts/);
  await expect(steps.nth(2)).toContainText('Follows');
  // The verdicts by outcome add up to the number the step leads with.
  const figures = await steps.nth(2).getByRole('definition').allInnerTexts();
  const total = Number((await steps.nth(2).locator('strong').innerText()).replace(/,/g, ''));
  expect(figures.reduce((sum, text) => sum + Number(text.replace(/,/g, '')), 0)).toBe(total);
  await expect(method).toContainText('Input with chips');
  await expect(method.getByRole('link', { name: 'How the engine measures' })).toHaveAttribute(
    'href',
    '/methodology/',
  );
});

// The steps arrive once when first seen; a reader who asked for less motion sees them at rest.
test('the method is fully visible at once under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const method = page.getByRole('region', { name: /^Rules, recordings, verdicts/ });
  await expect(method.locator('[data-state], [data-play]')).toHaveCount(0);
  await expect(method.getByText(/\d+ steps recorded/)).toBeVisible();
});

test('the page has no pause control, because nothing loops', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /animations/ })).toHaveCount(0);
});

// Found 2026-11-11: pressing Backspace changed five lanes and said nothing to a screen reader.
// Found 2026-11-12: the example looped by itself, so a press looked like it did nothing. It now
// plays once when first seen (the opening's scene), keeps the result, and waits for the reader.
const example = (page: Page) => page.getByRole('region', { name: /These fields look the same/ });
// "Waiting for Backspace" and each result share a cell; only the shown one counts.
const waiting = (page: Page) =>
  example(page).getByText('Waiting for Backspace').filter({ visible: true });

test('the Backspace example plays once by itself, silently, then keeps its result', async ({
  page,
}) => {
  await page.goto('/');
  await example(page).scrollIntoViewIfNeeded();
  await expect(example(page).getByRole('button', { name: /Press again/ })).toBeVisible();
  await expect(waiting(page)).toHaveCount(0);
  // Unprompted, so nothing is said: a sentence on load would interrupt a screen reader.
  await expect(example(page).getByRole('status')).toHaveText('');
  await page.waitForTimeout(3000);
  await expect(waiting(page)).toHaveCount(0);
});

test('Press again shows the starting state, then plays and says what happened', async ({
  page,
}) => {
  await page.goto('/');
  await example(page).scrollIntoViewIfNeeded();
  await example(page)
    .getByRole('button', { name: /Press again/ })
    .click();
  await expect(waiting(page)).toHaveCount(4);
  await expect(waiting(page)).toHaveCount(0);
  await expect(example(page).getByRole('status')).toHaveText(/^Backspace pressed in 4 systems: /);
  await expect(example(page).getByText('Removed a chip').first()).toBeVisible();
});

test('the real Backspace key presses the example while its button has focus', async ({ page }) => {
  await page.goto('/');
  await example(page).scrollIntoViewIfNeeded();
  const button = example(page).getByRole('button', { name: /Press again/ });
  await button.focus();
  await page.keyboard.press('Backspace');
  await expect(example(page).getByRole('status')).toHaveText(/^Backspace pressed in 4 systems: /);
  await expect(button).toBeFocused();
});

test('the example shows no controls around its fields to press', async ({ page }) => {
  await page.goto('/');
  await example(page).scrollIntoViewIfNeeded();
  await expect(example(page).getByText('Next', { exact: true })).toHaveCount(0);
});

// Verdict audit 2026-11-15: with two patterns the sentence read as six systems in each, and a
// reader could not add the totals up again from the cards below it. Three patterns since
// 2026-11-16.
test('the totals name each pattern with its rules and the systems it counts', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toContainText(
    'Totals for every pattern measured so far: Input with chips (8 rules, 4 systems counted), Combobox (10 rules, 6 systems counted), Menu button (9 rules, 6 systems counted), Tabs (9 rules, 5 systems counted), and Modal dialog (10 rules, 6 systems counted).',
  );
});
