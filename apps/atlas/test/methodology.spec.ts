import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`methodology has no axe violations in the ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/methodology/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("the footer's Suggest a correction leads to how corrections work, and a way to file one", async ({
  page,
}) => {
  await page.goto('/patterns/input-with-chips/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Suggest a correction' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Suggest a correction' }),
  ).toBeInViewport();
  await expect(page.getByRole('link', { name: 'open a correction' })).toHaveAttribute(
    'href',
    'https://github.com/kostya-gromov/earshot-atlas/issues/new?template=correction.yml',
  );
});

test('the provenance example is a real measured system, not the reference', async ({ page }) => {
  await page.goto('/methodology/');
  const provenance = page.locator('#provenance');
  await expect(provenance).toContainText('Chromium');
  await expect(provenance).not.toContainText('Reference,');
});

test('the pattern page ends with how to read it and a link to the methodology', async ({
  page,
}) => {
  await page.goto('/patterns/input-with-chips/');
  const note = page.getByRole('complementary', { name: 'How to read Atlas' });
  await expect(note).toContainText('Guidance, not certification.');
  await expect(note.getByRole('link', { name: 'Read the methodology' })).toHaveAttribute(
    'href',
    '/methodology/',
  );
  await expect(page.getByRole('contentinfo')).not.toContainText('not a conformance audit');
});

// Content audit and rebuild, 2026-11-13: the page is read by jumping, shows its method with the
// real data, and says what changed and when.
test('every link in "On this page" leads to a part of the page', async ({ page }) => {
  await page.goto('/methodology/');
  const links = page.getByRole('navigation', { name: 'On this page' }).getByRole('link');
  await expect(links).toHaveCount(13);
  for (const link of await links.all()) {
    const id = (await link.getAttribute('href'))!.slice(1);
    await expect(page.locator(`#${id}`).getByRole('heading', { level: 2 })).toHaveCount(1);
  }
});

test('the measured systems and the scenarios are tables built from the measurement files', async ({
  page,
}) => {
  await page.goto('/methodology/');
  const systems = page.getByRole('table', { name: 'Measured systems for input with chips' });
  await expect(systems.getByRole('rowheader')).toHaveCount(6);
  for (const system of ['Atlassian', 'Chakra UI', 'Fluent 2', 'MUI']) {
    await expect(systems.getByRole('row', { name: new RegExp(system) })).toContainText('Counted');
  }
  // Since 2026-11-13 (ADR 0009): measured on a composition while its own component is not.
  await expect(systems.getByRole('row', { name: /React Aria/ })).toContainText(
    'Shown, not counted: its own component for this pattern, TokenField, is not measured yet',
  );
  await expect(systems.getByRole('row', { name: /MUI/ })).toContainText('9.5.0');
  await expect(systems.getByRole('row', { name: /GitHub Primer/ })).toContainText(
    'Shown, not counted',
  );
  // Each pattern's scenarios open on their own (8c77915): together they run to some fifty rows.
  await page.getByRole('button', { name: 'Input with chips: 10 scenarios' }).click();
  const scenarios = page.getByRole('table', { name: 'Scenarios for Input with chips' });
  await expect(scenarios.getByRole('rowheader')).toHaveCount(10);
  await expect(scenarios.getByRole('row', { name: /Backspace twice/ })).toContainText(
    'Backspace twice to remove',
  );
});

test('it says what the engine does not look at, and what changed and when', async ({ page }) => {
  await page.goto('/methodology/');
  await expect(page.getByRole('region', { name: 'In short' })).toContainText(
    'It does not look at the screen',
  );
  await expect(page.locator('#limitations')).toContainText('Nothing visual is measured');
  await expect(page.locator('#changes')).toContainText('11 Nov 2026');
  await expect(page.locator('#reading')).toContainText('Agreement is a count, not a score');
});

// Design review 2026-11-13: the list of contents left the screen after the first of eleven
// screens, and two tables hid columns behind a sideways scroll on a phone.
test('on a wide screen the contents stay beside the text and mark the current part', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/methodology/');
  const nav = page.getByRole('navigation', { name: 'On this page' });
  await nav.getByRole('link', { name: 'Verdicts' }).click();
  await expect(nav.getByRole('link', { name: 'Verdicts' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(nav.getByRole('link', { name: 'Verdicts' })).toBeInViewport();
  await expect(nav.locator('[aria-current]')).toHaveCount(1);
});

test('at 390 px a Contents link leads back, and no table hides a column', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/methodology/');
  await expect(page.getByRole('link', { name: 'Contents', exact: true })).toHaveCount(0);
  await page.locator('#scenarios').scrollIntoViewIfNeeded();
  const back = page.getByRole('link', { name: 'Contents', exact: true });
  await expect(back).toBeVisible();
  // Each pattern's scenarios open on their own (8c77915): together they run to some fifty rows.
  await page.getByRole('button', { name: 'Input with chips: 10 scenarios' }).click();
  const scenarios = page.getByRole('table', { name: 'Scenarios for Input with chips' });
  // The last column, once off screen behind a sideways scroll, is on screen within the page width.
  const judges = scenarios
    .getByRole('row', { name: /Backspace twice/ })
    .getByRole('cell')
    .last();
  await expect(judges).toContainText('Backspace twice to remove');
  await judges.scrollIntoViewIfNeeded();
  const box = (await judges.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  const overflow = await scenarios.evaluate(
    (table) => table.parentElement!.scrollWidth - table.parentElement!.clientWidth,
  );
  expect(overflow).toBe(0);
  await back.click();
  await expect(
    page.getByRole('navigation', { name: 'On this page' }).getByRole('list'),
  ).toBeInViewport();
});

test('verdict terms carry the marks the pattern page uses', async ({ page }) => {
  await page.goto('/methodology/');
  const verdicts = page.locator('#verdicts');
  await expect(verdicts.locator('dt [data-tone="differ"]')).toHaveCount(1);
  await expect(verdicts.locator('dt [data-mark="dash"]')).toHaveCount(1);
});
