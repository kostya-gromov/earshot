import { expect, test, type Page } from '@playwright/test';

// Visual regression in the four modes apps/atlas/CLAUDE.md names. Run with `pnpm test:visual`; baselines
// are per platform, and CI compares in the Playwright container (see .github/workflows).

const pages = [
  { name: 'home', path: '/' },
  { name: 'pattern', path: '/patterns/input-with-chips/' },
  { name: 'combobox', path: '/patterns/combobox/' },
  { name: 'menu-button', path: '/patterns/menu-button/' },
  { name: 'tabs', path: '/patterns/tabs/' },
  { name: 'methodology', path: '/methodology/' },
] as const;

const modes = {
  light: { colorScheme: 'light', reducedMotion: 'no-preference', forcedColors: 'none' },
  dark: { colorScheme: 'dark', reducedMotion: 'no-preference', forcedColors: 'none' },
  forced: { colorScheme: 'dark', reducedMotion: 'no-preference', forcedColors: 'active' },
  reduced: { colorScheme: 'dark', reducedMotion: 'reduce', forcedColors: 'none' },
} as const;

const widths = [1440, 390] as const;

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // The live reference of a pattern page is drawn by its own module: wait until it runs.
  const reference = page.getByTestId('live-reference');
  if ((await reference.count()) > 0) await reference.locator('[data-ready="true"]').waitFor();
  await arrive(page);
}

// Parts below the fold wait for the reader (ui/arrival). A full-page capture never scrolls, so
// without this the baseline would approve drawings and meters that are still hidden.
async function arrive(page: Page) {
  const waiting = page.locator('[data-state="waiting"]');
  for (let left = await waiting.count(); left > 0; left = await waiting.count()) {
    await waiting.first().evaluate((element) => element.scrollIntoView({ block: 'start' }));
    // One scroll can bring in more than one block.
    await expect.poll(() => waiting.count()).toBeLessThan(left);
  }
  // Let a figure's one run end and return to its resting drawing.
  await page.clock.runFor(5000);
  await page.evaluate(() => window.scrollTo(0, 0));
}

for (const { name, path } of pages) {
  for (const [mode, media] of Object.entries(modes)) {
    for (const width of widths) {
      test(`${name} looks as approved: ${mode}, ${width}px`, async ({ page }) => {
        // A frozen clock stops the scene and every timer where the page first draws them. Installed
        // alone the clock still runs: a timer of the home page's example (900 ms) then fired or not
        // depending on how long the capture took (2026-11-19). Paused, time moves only by runFor.
        await page.clock.install({ time: new Date('2026-11-08T12:00:00Z') });
        await page.clock.pauseAt(new Date('2026-11-08T12:00:00Z'));
        await page.emulateMedia(media);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await settle(page);
        await expect(page).toHaveScreenshot(`${name}-${mode}-${width}.png`, {
          fullPage: true,
          animations: 'disabled',
          stylePath: 'test/visual/screenshot.css',
          maxDiffPixelRatio: 0.002,
        });
      });
    }
  }
}
