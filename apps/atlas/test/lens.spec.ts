import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const url = '/patterns/input-with-chips/';

for (const colorScheme of ['light', 'dark'] as const) {
  for (const lens of ['For design', 'For code'] as const) {
    test(`${lens} has no axe violations in the ${colorScheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(url);
      await page.getByRole('tab', { name: new RegExp(lens) }).click();
      // Marked lines are the lowest-contrast background the code sits on.
      if (lens === 'For code') {
        await page
          .locator('section[aria-labelledby="lens-title"]')
          .getByRole('button', { name: /^Backspace twice/ })
          .click();
      }
      const results = await new AxeBuilder({ page })
        .include('section[aria-labelledby="lens-title"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

test('the lens switch is one Tab stop and arrows move between the lenses', async ({ page }) => {
  await page.goto(url);
  const design = page.getByRole('tab', { name: /For design/ });
  await design.focus();
  await page.keyboard.press('ArrowRight');
  const code = page.getByRole('tab', { name: /For code/ });
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: /For code/ })).toBeVisible();
});

test('every design requirement is listed with its sources', async ({ page }) => {
  await page.goto(url);
  const panel = page.getByRole('tabpanel', { name: /For design/ });
  await expect(
    panel.getByRole('heading', { level: 4, name: /Focus ring on every chip/ }),
  ).toBeVisible();
  await expect(panel.getByRole('link', { name: /2\.5\.8/ })).toHaveAttribute(
    'href',
    'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html',
  );
});

test('a note opens its file and marks the lines it explains', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('tab', { name: /For code/ }).click();
  const note = page.getByRole('button', { name: /Repeated messages still speak/ });
  await note.click();
  await expect(note).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('tab', { name: 'announcer.ts' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const marked = page.getByRole('tabpanel', { name: 'announcer.ts' }).locator('.line[data-marked]');
  await expect(marked).toHaveCount(4);
  await expect(marked.first()).toContainText('Clear first');
});

test('Copy as JavaScript copies the served file, with types removed', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(url);
  await page.getByRole('tab', { name: /For code/ }).click();
  await page.getByRole('tab', { name: 'selection.ts' }).click();
  await page.getByRole('button', { name: 'Copy as JavaScript' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Copied selection.js' })).toBeAttached();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).not.toMatch(/: string\b|: readonly /);
  expect(copied.length).toBeGreaterThan(50);
});

test('the behavior contract lists every scenario the engine runs', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('tab', { name: /For code/ }).click();
  const contract = page.getByLabel('Behavior contract', { exact: true });
  for (const id of [
    'tab-out',
    'shift-tab-out',
    'tab-from-chip',
    'backspace-twice',
    'arrows',
    'delete-focused',
    'remove-click',
  ]) {
    await expect(contract).toContainText(`scenario ${id}`);
  }
});

test('on a phone the code lens scrolls inside its regions, never the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await page.getByRole('tab', { name: /For code/ }).click();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);
});

test('Copy file copies the source exactly as written, types included', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(url);
  await page.getByRole('tab', { name: /For code/ }).click();
  await page.getByRole('tab', { name: 'selection.ts' }).click();
  await page.getByRole('button', { name: 'Copy file' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Copied selection.ts' })).toBeAttached();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/: (string|readonly|number|boolean)\b/);
});

// The home page links straight to a lens (design review 2026-11-12).
test('a link with ?lens=code opens the For code tab', async ({ page }) => {
  await page.goto('/patterns/input-with-chips/?lens=code#lens');
  const lenses = page.getByRole('tablist', { name: 'Details for your role' });
  await expect(lenses.getByRole('tab', { name: /For code/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
