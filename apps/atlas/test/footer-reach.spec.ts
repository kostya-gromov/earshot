import { expect, test } from '@playwright/test';

// Design review 2026-11-19: on a phone the methodology's floating "Contents" sat over the
// footer's theme switch 30 to 60 px before the end; a tap on Light opened the contents.
for (const path of ['/', '/methodology/', '/patterns/input-with-chips/']) {
  test(`at 390 px nothing fixed covers a footer control on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const covered: string[] = [];
    for (let short = 200; short >= 0; short -= 20) {
      await page.evaluate(
        (by) => window.scrollTo(0, document.documentElement.scrollHeight - innerHeight - by),
        short,
      );
      // Longer than the floating button's fade (150 ms).
      await page.waitForTimeout(220);
      const found = await page.getByRole('contentinfo').evaluate((footer) =>
        [...footer.querySelectorAll('a, button')].flatMap((control) => {
          // The first line's box: a link on two lines has empty space beside its shorter line.
          const box = control.getClientRects()[0] ?? control.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          if (y < 0 || y > innerHeight) return [];
          const top = document.elementFromPoint(x, y);
          return top && control.contains(top) ? [] : [control.textContent ?? ''];
        }),
      );
      covered.push(...found.map((name) => `${name} at ${short} px from the end`));
    }
    expect(covered).toEqual([]);
  });
}
