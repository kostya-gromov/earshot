import { expect, test, type Page } from '@playwright/test';

/*
 * A code note shows the lines it explains: after a note is chosen, by pointer or by keyboard,
 * its first marked line is on screen and not under the sticky header. Below 860 px the code
 * sits above the notes, and choosing a note scrolled the code inside its pane but not the page:
 * at 390 px the lines were up to 389 px above the screen (design review of the select preview,
 * 2026-11-24; every pattern shares the lens). Run with the panel's invariants (2026-11-24).
 * The chosen note stays on screen as well: scrolling the page to the lines took the focused note
 * 121 px below the screen, so below 860 px the code stays under the header while the notes
 * scroll (2026-11-25).
 */
const pages = [
  '/patterns/input-with-chips/',
  '/patterns/combobox/',
  '/patterns/menu-button/',
  '/patterns/tabs/',
  '/patterns/dialog/',
  '/patterns/select/',
] as const;

async function openNotes(page: Page, path: string) {
  await page.goto(`${path}?lens=code`);
  const notes = page.getByRole('list', { name: 'Notes' }).getByRole('button');
  await expect(notes.first()).toBeVisible();
  return notes;
}

/** Where the first marked line is against the screen and the header, once scrolling settles. */
async function markedLinePlace(page: Page) {
  const line = page.locator('.line[data-marked]').first();
  await expect(line).toBeAttached();
  // Two frames after the last scroll: the place is read once it no longer moves.
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
  const box = await line.boundingBox();
  const header = await page.getByRole('banner').boundingBox();
  if (!box || !header) throw new Error('no marked line or no header');
  return { top: box.y, bottom: box.y + box.height, headerBottom: header.y + header.height };
}

for (const path of pages) {
  for (const mode of ['pointer', 'keyboard'] as const) {
    test(`${path} at 390, ${mode}: a chosen note's lines are on screen`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const notes = await openNotes(page, path);
      // The last note: the farthest from the code above it.
      const note = notes.last();
      if (mode === 'pointer') await note.click();
      else {
        await note.focus();
        await page.keyboard.press('Enter');
      }
      const place = await markedLinePlace(page);
      expect(place.top, 'below the header').toBeGreaterThanOrEqual(place.headerBottom - 1);
      expect(place.bottom, 'above the bottom of the screen').toBeLessThanOrEqual(844 + 1);
      const chosen = await note.boundingBox();
      if (!chosen) throw new Error('no chosen note');
      expect(chosen.y, 'the chosen note below the header').toBeGreaterThanOrEqual(
        place.headerBottom - 1,
      );
      expect(chosen.y + chosen.height, 'the chosen note on screen').toBeLessThanOrEqual(844 + 1);
      await context.close();
    });
  }
}

/*
 * Focus is never under the stuck code panel: going back up the notes with Shift+Tab, every focused
 * note has its centre on screen and not covered (WCAG 2.4.11). The browser scrolls only when focus
 * leaves the viewport, not when it goes under a sticky element: on 2026-11-25 most notes went
 * wholly under the panel (design review, 9 of 11 on combobox at 390).
 */
for (const path of pages) {
  for (const width of [390, 768] as const) {
    test(`${path} at ${width}: Shift+Tab up the notes never puts focus under the code`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const notes = await openNotes(page, path);
      const count = await notes.count();
      await notes.last().focus();
      const covered: string[] = [];
      for (let index = count - 1; index >= 0; index -= 1) {
        if (index < count - 1) await page.keyboard.press('Shift+Tab');
        const isClear = await notes.nth(index).evaluate((note) => {
          const box = note.getBoundingClientRect();
          const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
          return hit !== null && note.contains(hit);
        });
        if (!isClear) covered.push(`note ${index + 1} of ${count}`);
      }
      expect(covered, 'focused notes covered').toEqual([]);
      await context.close();
    });
  }
}

/*
 * The stuck code panel shows whole lines: at rest, no code line crosses its bottom edge. The
 * lines are inline blocks, and their line boxes put about 1 px between them, so a height rounded
 * to their own height still cut one (second design review, 2026-11-25).
 */
for (const [width, height] of [
  [390, 844],
  [390, 700],
  [768, 1024],
] as const) {
  test(`at ${width}x${height} the code panel ends between two lines`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await openNotes(page, '/patterns/combobox/');
    const cut = await page.evaluate(() => {
      const panel = document.querySelector('[role="tabpanel"] .line')?.closest('[role="tabpanel"]');
      if (!(panel instanceof HTMLElement)) return 'no panel';
      const edge = panel.getBoundingClientRect().top + panel.clientTop + panel.clientHeight;
      const lines = [...panel.querySelectorAll('.line')].map((line) =>
        line.getBoundingClientRect(),
      );
      const crossing = lines.find(({ top, bottom }) => top < edge - 0.5 && bottom > edge + 0.5);
      return crossing ? `a line from ${crossing.top} to ${crossing.bottom}, edge ${edge}` : '';
    });
    expect(cut, 'a code line crossing the bottom edge').toBe('');
    await context.close();
  });
}
