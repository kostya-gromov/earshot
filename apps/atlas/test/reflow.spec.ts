import { expect, test, type Page } from '@playwright/test';

// WCAG 1.4.10 Reflow: at 320 CSS px wide nothing may ask for scrolling in two directions. A
// recording draws its keys in one row, and a long scenario's row was wider than a phone: the
// whole page scrolled sideways once it was chosen (design review, 2026-11-22). Every scenario of
// every rule of every pattern is chosen here, at 320 and at 390.
const patterns = ['input-with-chips', 'combobox', 'menu-button', 'tabs', 'dialog'] as const;
const widths = [320, 390] as const;

// What is known to be too wide and is not a recording's doing. Each entry is a defect on record
// (docs/follow-ups/dialog.md), held here exactly: the test fails when it grows, and when it is
// fixed, so that the entry is then removed.
// None since reference 0.1.8: its tabs wrap to a second row at 320.
const known: Readonly<Record<string, readonly string[]>> = {};

const shownPanel = (page: Page) => page.locator('[role="tabpanel"][id^="rule-"]:not([hidden])');
const scrollWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth);

/** Opens every fold of the shown rule, so every scenario row can be chosen. */
async function openFolds(page: Page) {
  for (const fold of await shownPanel(page)
    .getByRole('button', { name: /more scenarios?/ })
    .all()) {
    if ((await fold.getAttribute('aria-expanded')) === 'false') await fold.click();
  }
}

/** Chooses each scenario of the shown rule in turn; returns those that widened the page. */
async function tooWide(page: Page, limit: number): Promise<string[]> {
  const rule = (await shownPanel(page).getAttribute('id')) ?? 'rule';
  const list = shownPanel(page)
    .locator('ul[aria-label$="the scenarios behind this verdict"]')
    .first();
  const found: string[] = [];
  const count = await list.locator('button[aria-pressed]:visible').count();
  for (let index = 0; index < count; index += 1) {
    const row = list.locator('button[aria-pressed]:visible').nth(index);
    await row.click();
    const wide = await scrollWidth(page);
    if (wide > limit) {
      const name = ((await row.textContent()) ?? '').split('·')[0]!.trim().slice(0, 60);
      found.push(`${rule} · ${name}: ${wide} px`);
    }
  }
  return found;
}

for (const pattern of patterns) {
  for (const width of widths) {
    test(`${pattern} at ${width}: no scenario makes the page scroll sideways`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/patterns/${pattern}/`);
      const found: string[] = [];
      const atLoad = await scrollWidth(page);
      if (atLoad > width) found.push(`the page as it loads: ${atLoad} px`);
      const rules = page.locator('[role="tab"][aria-controls^="rule-"]');
      const ruleCount = await rules.count();
      expect(ruleCount).toBeGreaterThan(0);
      for (let index = 0; index < ruleCount; index += 1) {
        await rules.nth(index).click();
        await openFolds(page);
        // Against the page as it loaded: where that is already too wide (said above), a scenario
        // is charged only for widening it further.
        found.push(...(await tooWide(page, Math.max(width, atLoad))));
      }
      expect(found).toEqual(known[`${pattern} at ${width}`] ?? []);
    });
  }
}
