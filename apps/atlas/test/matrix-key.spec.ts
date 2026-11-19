import { expect, test } from '@playwright/test';

const url = '/patterns/input-with-chips/';

// Design review 2026-11-11: the marks were explained only in each cell's name, and Not applicable
// looked the same as Inconclusive.
test('the matrix has a visible key in the marks it uses', async ({ page }) => {
  await page.goto(url);
  const key = page.getByRole('list', { name: 'Key' });
  for (const word of ['Follows', 'Differs', 'Inconclusive', 'Not applicable']) {
    await expect(key).toContainText(word);
  }
  await expect(key).toContainText('Judged on part of its scenarios');
  await expect(key).toContainText('Explained by a different model');
});

test('not applicable and inconclusive are drawn with different marks', async ({ page }) => {
  await page.goto(url);
  const mark = (name: RegExp) =>
    page
      .getByRole('grid')
      .getByRole('link', { name })
      .first()
      .locator('[data-tone]')
      .getAttribute('data-mark');
  expect(await mark(/Not applicable/)).toBe('dash');
  expect(await mark(/Inconclusive/)).toBeNull();
});

// Design review 2026-11-11 (pass 2): at 390 px three of six systems sat behind a swipe nobody
// was prompted to make. Every column now fits.
test('at 390 px the matrix shows every system without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  const overflow = await page
    .getByRole('grid')
    .evaluate((grid) => grid.parentElement!.scrollWidth - grid.parentElement!.clientWidth);
  expect(overflow).toBe(0);
});
