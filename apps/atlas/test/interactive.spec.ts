import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/lab/');
});

test.describe('disclosure', () => {
  test('toggles with Enter and Space and reports its state', async ({ page }) => {
    const root = page.getByTestId('lab-disclosure');
    const button = root.getByRole('button', { name: 'Evidence' });
    const content = root.getByText('Evidence for one rule');

    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toBeHidden();
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(content).toBeVisible();
    await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });
});

test.describe('tabs', () => {
  test('is one Tab stop and arrows select with wrap, Home and End', async ({ page }) => {
    const root = page.getByTestId('lab-file-tabs');
    const tabs = root.getByRole('tab');
    await expect(tabs).toHaveCount(3);
    await expect(root.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);

    await tabs.first().focus();
    await page.keyboard.press('ArrowLeft');
    await expect(tabs.nth(2)).toBeFocused();
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(root.getByRole('tabpanel')).toHaveAccessibleName('announcer.ts');

    await page.keyboard.press('Home');
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(tabs.nth(2)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('Tab moves from the selected tab into its panel', async ({ page }) => {
    const root = page.getByTestId('lab-lens-tabs');
    await root.getByRole('tab', { name: /For code/ }).click();
    await page.keyboard.press('Tab');
    await expect(root.getByRole('tabpanel', { name: /For code/ })).toBeFocused();
  });

  test('shows exactly one panel', async ({ page }) => {
    const root = page.getByTestId('lab-lens-tabs');
    await expect(root.getByRole('tabpanel')).toHaveCount(1);
    await root.getByRole('tab', { name: /For code/ }).click();
    await expect(root.getByRole('tabpanel')).toHaveCount(1);
    await expect(root.getByText('Code lens content.')).toBeVisible();
  });
});
