import { expect, test, type Locator, type Page } from '@playwright/test';

// The three steps of the method are one series: a large count, a line drawing of what the step
// is about, counted rows with a meter. Step 1 was a list beside an empty column (2026-11-15).
test.describe('step 1 of the method, the rules', () => {
  const step = (page: Page) => page.locator('#how ol > li').first();

  test('counts the rules, draws how one is made, and counts the two levels', async ({ page }) => {
    await page.goto('/');
    await expect(step(page)).toContainText('27 rules so far, in 3 patterns');
    await expect(step(page).locator('svg')).toHaveCount(1);
    await expect(step(page)).toContainText('From the standards16');
    await expect(step(page)).toContainText('Atlas recommendations11');
    // The drawing shows a rule built from the standards; it does not speak for the other eleven.
    await expect(step(page).locator('figcaption')).toHaveText(
      // No rule applies a WCAG criterion directly, and the caption says so: the drawing joins
      // both standards to a rule.
      'How 16 of 27 rules are built: each applies an APG page, and cites WCAG where a criterion relates. The other 11 are Atlas recommendations; each says why.',
    );
  });

  test('lists the cited pages in two groups, each with its count', async ({ page }) => {
    await page.goto('/');
    const wcag = step(page).getByRole('region', { name: /^WCAG/ });
    const apg = step(page).getByRole('region', { name: /^APG/ });
    await expect(wcag.getByRole('heading')).toHaveText('WCAG 5 criteria');
    await expect(wcag.getByRole('listitem')).toHaveCount(5);
    await expect(apg.getByRole('heading')).toHaveText('APG 13 pages');
    await expect(apg.getByRole('listitem')).toHaveCount(13);
    // Pages, not rules: one page may stand behind several rules.
    await expect(step(page)).toContainText('18 pages cited');
    // A related page is not listed as a requirement: said once, over the pages it is true of.
    // Since 2026-11-17 no rule applies a WCAG criterion directly: 2.4.3 is about the order of
    // focus, not where it goes after a removal, so all five are related and none stands apart.
    await expect(wcag.getByText('Applied', { exact: true })).toHaveCount(0);
    await expect(wcag.getByText('Related, not applied directly')).toHaveCount(1);
    await expect(wcag.getByRole('list')).toHaveCount(1);
    // One APG section is cited only as related (persistence of focus, for "Keep focus in the
    // field after a removal"), so that group is split: twelve applied, one related.
    await expect(apg.getByText('Applied', { exact: true })).toHaveCount(1);
    await expect(apg.getByText('Related, not applied directly')).toHaveCount(1);
    await expect(apg.getByRole('list').last().getByRole('listitem')).toHaveText([
      /discernible and predictable keyboard focus/,
    ]);
  });

  // Between one column and the wide layout the whole list stands beside the left column, which
  // then stays in view. What is fixed is that it sticks at all.
  test('at 1100 px the left column is sticky beside the list', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto('/');
    const side = step(page).locator(':scope > div').first();
    expect(await side.evaluate((column) => getComputedStyle(column).position)).toBe('sticky');
    // Shorter than the count and the list beside it, so there is something to hold it against.
    const heights = await step(page).evaluate((li) => ({
      side: li.firstElementChild!.getBoundingClientRect().height,
      step: li.getBoundingClientRect().height,
    }));
    expect(heights.side).toBeLessThan(heights.step - 150);
    // The count leads the right column, level with the title, as in steps 2 and 3.
    const edges = await page
      .locator('#how ol > li')
      .evaluateAll((steps) =>
        steps.map((li) =>
          Math.round(li.querySelector(':scope > p > strong')!.getBoundingClientRect().left),
        ),
      );
    expect(new Set(edges).size).toBe(1);
  });

  // From 1200 px the long list (APG) stands under the step in two columns and the short one
  // (WCAG) under the count: nothing long is beside the left column, and it does not stick, so it
  // never travels over the list below (design review 2026-11-16).
  test('at 1440 px APG is in two columns under the step and nothing overlaps', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const side = step(page).locator(':scope > div').first();
    expect(await side.evaluate((column) => getComputedStyle(column).position)).toBe('static');
    const apg = step(page).getByRole('region', { name: /^APG/ });
    const lefts = await apg
      .getByRole('listitem')
      .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().left)));
    expect(new Set(lefts).size).toBe(2);
    const edge = (locator: Locator, which: 'top' | 'bottom') =>
      locator.evaluate((el, side) => el.getBoundingClientRect()[side], which);
    const apgTop = await edge(apg, 'top');
    expect(apgTop).toBeGreaterThanOrEqual(await edge(side, 'bottom'));
    const wcag = step(page).getByRole('region', { name: /^WCAG/ });
    expect(apgTop).toBeGreaterThanOrEqual(await edge(wcag, 'bottom'));
  });

  test('at 390 px nothing is sticky and the order is title, count, drawing, levels, list', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const tops = await step(page).evaluate((li) => {
      const top = (selector: string) => li.querySelector(selector)!.getBoundingClientRect().top;
      const position = getComputedStyle(li.firstElementChild!).position;
      // The count is the step's own line; the meters under the drawing have numbers too.
      const count = top(':scope > p > strong');
      return { order: [top('h3'), count, top('svg'), top('h4')], position };
    });
    expect(tops.order).toEqual([...tops.order].sort((a, b) => a - b));
    expect(tops.position).not.toBe('sticky');
  });

  // Design review 2026-11-15: the run began when the block's top edge was seen, with the drawing
  // still under the fold.
  test('the drawing runs once it is itself in view, and ends at rest', async ({ page }) => {
    await page.goto('/');
    const figure = step(page).locator('[data-figure]');
    await expect(figure).not.toHaveAttribute('data-play');
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveAttribute('data-play', '');
    await expect(figure).not.toHaveAttribute('data-play', '', { timeout: 4000 });
  });

  test('under reduced motion the drawing does not run', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await step(page).locator('svg').hover();
    const running = await step(page).evaluate((li) => li.getAnimations({ subtree: true }).length);
    expect(running).toBe(0);
  });
});
