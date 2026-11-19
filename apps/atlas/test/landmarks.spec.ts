import { expect, test } from '@playwright/test';

// A screen reader user moves by landmarks and headings: two regions with one name cannot be told
// apart, and a repeated id makes aria-labelledby name a section after the wrong heading. Found
// 2026-11-11: the home's "Guidance, not certification" section was named after "How it works"
// because both used id="how-title". axe's WCAG tags do not catch either.
for (const path of ['/', '/patterns/input-with-chips/', '/methodology/']) {
  test(`${path}: every region has its own name and every id is unique`, async ({ page }) => {
    await page.goto(path);
    const regionNames = await Promise.all(
      (await page.getByRole('region').all()).map(async (region) =>
        region.evaluate((el) => {
          const labelledBy = el.getAttribute('aria-labelledby');
          const label = labelledBy
            ? labelledBy
                .split(' ')
                .map((id) => document.getElementById(id)?.textContent ?? '')
                .join(' ')
            : (el.getAttribute('aria-label') ?? '');
          return label.trim();
        }),
      ),
    );
    const repeatedNames = regionNames.filter((name, i) => regionNames.indexOf(name) !== i);
    expect(repeatedNames).toEqual([]);
    const repeatedIds = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(repeatedIds).toEqual([]);
  });
}
