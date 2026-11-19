import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const modes = [
  { name: 'light', colorScheme: 'light' },
  { name: 'dark', colorScheme: 'dark' },
] as const;

for (const { name, colorScheme } of modes) {
  test(`lab has no axe violations in the ${name} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/lab/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('glyph keycaps keep their spoken names for screen readers', async ({ page }) => {
  await page.goto('/lab/');
  const lightColumn = page.locator('#lab-primitives ~ * [data-theme="light"]');
  await expect(lightColumn.locator('kbd', { hasText: 'Left Arrow' }).first()).toBeAttached();
  await expect(lightColumn.locator('kbd', { hasText: 'Backspace' }).first()).toBeAttached();
  await expect(lightColumn.getByText('plus', { exact: true }).first()).toBeAttached();
});

test('verdict badges differ by marker shape, not colour alone', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/lab/');
  const markers = page.locator(
    '#lab-primitives ~ * [data-theme="light"] [data-tone] > span[aria-hidden]',
  );
  const shapes = await markers.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return `${style.transform}|${style.borderRightWidth}|${style.borderTopWidth}`;
    }),
  );
  // follows, differs and inconclusive must each look different; not-applicable shares the ring.
  expect(new Set(shapes.slice(0, 3)).size).toBe(3);
});
