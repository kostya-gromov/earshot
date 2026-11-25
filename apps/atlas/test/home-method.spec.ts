import { expect, test, type Page } from '@playwright/test';

// The method on the home page since 2026-11-25 (after external feedback): the recording
// and the verdicts with their drawings and counts, and the rules counted in one line. The rule
// step and its list of every cited page moved to /methodology ("What the rules rest on").
const method = (page: Page) => page.getByRole('region', { name: /^How it is measured/ });

test('the method is the recording and the verdicts, with the rules counted in one line', async ({
  page,
}) => {
  await page.goto('/');
  const steps = method(page).locator('ol > li');
  await expect(steps).toHaveCount(2);
  await expect(steps.nth(0)).toContainText('Recording');
  await expect(steps.nth(1)).toContainText('Verdict');
  await expect(method(page)).toContainText(
    /\d+ rules so far, in \d+ patterns: \d+ from the standards, \d+ Earshot recommendations/,
  );
  await expect(
    method(page).getByRole('link', {
      name: /How the engine measures, and every page the rules cite/,
    }),
  ).toHaveAttribute('href', '/methodology/');
});

// External feedback, 2026-11-24: thirty links to w3.org read as part of the site.
test('the home page’s content links to no page of the standards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main a[href*="w3.org"]')).toHaveCount(0);
});
