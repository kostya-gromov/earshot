import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The list of every pattern, since 2026-11-23: the home page shows the three added last.
const url = '/patterns/';
const list = (page: Page) => page.getByRole('list', { name: 'Patterns' });
const row = (page: Page, name: string) =>
  list(page)
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the list of patterns has no axe violations in the ${colorScheme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto(url);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('every pattern is listed in the order it was added, each under the page title', async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Patterns');
  await expect(list(page).getByRole('heading', { level: 2 })).toHaveText([
    'Input with chips',
    'Combobox',
    'Menu button',
    'Tabs',
    'Modal dialog',
  ]);
  await expect(page.getByRole('main')).toContainText('5 patterns, 46 rules');
});

test('a row gives the counts the pattern page counts from, and leads to it', async ({ page }) => {
  await page.goto(url);
  const chips = row(page, 'Input with chips');
  // Counted as on the pattern page: GitHub Primer (deprecated) and React Aria (its own
  // component is not measured yet) are measured but not counted.
  await expect(chips).toContainText('Measured in Atlassian, Chakra UI, Fluent 2 and MUI.');
  // One fact a line, so the rows can be compared (design review 2026-11-23).
  await expect(chips.getByRole('list').getByRole('listitem')).toHaveText([
    '8 rules',
    '4 systems counted',
    '2 more measured, not counted',
    '4 systems without this component',
    /^Measured \d+ \w+ 2026$/,
  ]);
  await expect(row(page, 'Combobox').getByRole('list').getByRole('listitem')).toHaveText([
    '10 rules',
    '6 systems counted',
    /^Measured \d+ \w+ 2026$/,
  ]);
  await chips.getByRole('link', { name: 'Input with chips' }).click();
  await expect(page).toHaveURL(/\/patterns\/input-with-chips\/$/);
});

test('a row gives the pattern’s other names and its APG source, as a link that can be opened', async ({
  page,
}) => {
  await page.goto(url);
  const dialog = row(page, 'Modal dialog');
  await expect(dialog).toContainText('Also called dialog, modal and modal window.');
  const source = dialog.getByRole('link', { name: /Dialog \(Modal\)/ });
  await expect(source).toHaveAttribute('href', /w3\.org\/WAI\/ARIA\/apg\/patterns\/dialog-modal/);
  // The row is one link that covers it: the source must lie above it to take the click.
  // Asked of the point on screen, so the link has to be on it.
  await source.scrollIntoViewIfNeeded();
  const hit = await source.evaluate((link) => {
    const box = link.getBoundingClientRect();
    return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === link;
  });
  expect(hit).toBe(true);
  // A pattern without an APG pattern of its own names what it is built on.
  await expect(row(page, 'Input with chips')).toContainText('No APG pattern of its own. Built on');
});

// Design review 2026-11-23: with the pointer on the w3.org link the row lit its own way in.
test('pointing at a source link leaves "Open the pattern" at rest', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  const combobox = row(page, 'Combobox');
  const open = combobox.getByText('Open the pattern');
  const colour = () => open.evaluate((element) => getComputedStyle(element).color);
  const atRest = await colour();
  await combobox.getByRole('heading').hover();
  await expect.poll(colour).not.toBe(atRest);
  await combobox.getByRole('link', { name: /Combobox Pattern/ }).hover();
  await expect.poll(colour).toBe(atRest);
});

test('the footer of every page leads here', async ({ page }) => {
  await page.goto('/methodology/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'All patterns' }).click();
  await expect(page).toHaveURL(/\/patterns\/$/);
});

// Design review 2026-11-23: at 1440 by 900 the second row's frame is partly on the first
// screen, and it stood empty until the reader scrolled.
test('a drawing partly on screen at load is drawn', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  const frame = row(page, 'Combobox').locator('svg').first();
  await expect(frame).toBeInViewport();
  await expect(row(page, 'Combobox').locator('[data-state="waiting"]')).toHaveCount(0);
});

test('the breadcrumb of a pattern page leads here', async ({ page }) => {
  await page.goto('/patterns/tabs/');
  await page.getByRole('link', { name: 'Patterns', exact: true }).click();
  await expect(page).toHaveURL(/\/patterns\/$/);
});

// Design review 2026-11-23: with the home page's rows the first screen held one pattern and the
// top of a second. The catalogue's own row is denser: two whole rows on a 900 px screen.
test('at 1440 by 900 the first screen holds two whole patterns', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  const second = await row(page, 'Combobox').boundingBox();
  expect(second!.y + second!.height).toBeLessThanOrEqual(900);
});

for (const width of [320, 390] as const) {
  test(`the list does not scroll sideways at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(url);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}

// Motion: Arrival. A drawing below the fold waits, then fades in once; the text beside it is
// never hidden, and under reduced motion nothing waits.
test('a drawing below the fold fades in once; its text never waits', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto(url);
  const last = row(page, 'Modal dialog');
  const drawing = last.locator('[data-state]');
  await expect(drawing).toHaveAttribute('data-state', 'waiting');
  await expect(last.getByRole('heading')).toHaveCSS('opacity', '1');
  await last.scrollIntoViewIfNeeded();
  await expect(drawing).toHaveAttribute('data-state', 'seen');
  await expect(drawing).toHaveCSS('opacity', '1');
});

test('with reduced motion no drawing waits', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto(url);
  await expect(page.locator('[data-state="waiting"]')).toHaveCount(0);
});
