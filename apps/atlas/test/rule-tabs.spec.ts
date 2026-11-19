import { expect, test } from '@playwright/test';

const url = '/patterns/input-with-chips/';

// Design review 2026-11-11: on a phone eight stacked tabs came before the first rule.
test('at 390 px the rules are one row, and Right Arrow selects the next rule', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  const tabs = page.getByRole('tablist', { name: 'Rules' });
  await expect(tabs).toHaveAttribute('aria-orientation', 'horizontal');
  const first = tabs.getByRole('tab').first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab').nth(1)).toBeFocused();
  await expect(tabs.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
  // The row is one tab tall, so the rule starts within the first screen of the section.
  const box = await tabs.boundingBox();
  expect(box?.height).toBeLessThan(80);
});

test('at 1440 px the rules are a column moved with Up and Down', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  const tabs = page.getByRole('tablist', { name: 'Rules' });
  await expect(tabs).toHaveAttribute('aria-orientation', 'vertical');
  await tabs.getByRole('tab').first().focus();
  await page.keyboard.press('ArrowDown');
  await expect(tabs.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
});
