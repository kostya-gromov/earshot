import { expect, test, type Page } from '@playwright/test';

const url = '/patterns/input-with-chips/';

async function focusField(page: Page) {
  await page.goto(url);
  await page.locator('[data-chip-field][data-ready="true"]').waitFor();
  await page.getByRole('combobox', { name: 'To' }).focus();
}

const glow = (page: Page) =>
  page.locator('[data-testid="live-reference"] > div[aria-hidden="true"]').first();

test('the focus glow travels to the chip that has focus', async ({ page }) => {
  await focusField(page);
  await page.keyboard.press('ArrowLeft');
  const chip = page.locator('.chip').filter({ hasText: 'Hiroshi Matsui' });
  await expect(glow(page)).toHaveAttribute('data-visible', 'true');
  await expect
    .poll(async () => {
      const [g, c] = await Promise.all([glow(page).boundingBox(), chip.boundingBox()]);
      return g && c ? Math.round(Math.abs(g.x - c.x) + Math.abs(g.width - c.width)) : -1;
    })
    .toBeLessThan(2);
});

test('a removed chip leaves as a decorative ghost, then the ghost is gone', async ({ page }) => {
  await focusField(page);
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  const ghost = page.locator('[data-testid="live-reference"] > .chip[aria-hidden="true"]');
  await expect(ghost).toHaveCount(1);
  await expect(ghost).toHaveAttribute('inert', '');
  await expect(ghost).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove Hiroshi Matsui' })).toHaveCount(0);
});

test('under reduced motion a chip simply disappears', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await focusField(page);
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await expect(page.locator('[data-testid="live-reference"] > .chip')).toHaveCount(0);
});

// WCAG 2.2.2: blinking that starts by itself must stop within five seconds. A drawn caret is not
// the browser's own caret, so it is not exempt. Found 2026-11-11: the replay caret blinked forever,
// which also kept the axe tests waiting for animations that never finish.
test('no animation on the pattern page runs forever or past five seconds', async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-chip-field][data-ready="true"]').waitFor();
  const endless = await page.evaluate(() =>
    document.getAnimations().flatMap((animation) => {
      const timing = animation.effect?.getComputedTiming();
      const end = Number(timing?.endTime ?? 0);
      const target = (animation.effect as KeyframeEffect | null)?.target;
      return end === Infinity || end > 5000 ? [`${target?.className ?? '?'}: ${end} ms`] : [];
    }),
  );
  expect(endless).toEqual([]);
});

// apps/atlas/CLAUDE.md: under reduced motion, signature and functional motion become an instant
// change (a crossfade of 100 ms at most) and micro motion is off. Checked after scrolling the
// whole page, so section entrances have run, and after a tab change on the pattern page.
for (const path of ['/', '/patterns/input-with-chips/']) {
  test(`${path}: under reduced motion nothing moves longer than 100 ms`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const long: string[] = [];
    const collect = async () =>
      long.push(
        ...(await page.evaluate(() =>
          document.getAnimations().flatMap((animation) => {
            const timing = animation.effect?.getComputedTiming();
            const duration = Number(timing?.activeDuration ?? 0);
            const target = (animation.effect as KeyframeEffect | null)?.target;
            const name = `${target?.tagName.toLowerCase()}.${target?.className}`;
            return duration > 100 ? [`${name}: ${duration} ms`] : [];
          }),
        )),
      );
    for (let y = 0; y < 12; y += 1) {
      await page.mouse.wheel(0, 900);
      await collect();
    }
    if (path !== '/') {
      await page.locator('#tab-say').click();
      await collect();
    }
    expect([...new Set(long)]).toEqual([]);
  });
}
