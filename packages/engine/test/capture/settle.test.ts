import { chromium, type Browser } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { installPageScripts } from '../../src/capture/install.ts';
import { drainAnnouncements } from '../../src/capture/live-regions.ts';
import { SETTLE_OPTIONS, settle } from '../../src/runner/settle.ts';

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

describe('settle', () => {
  // Verdict audit 2026-11-13: the quiet window was counted from the last change on the page,
  // even one before the action. A page that had been still closed the step after two frames
  // (7 to 34 ms in the recordings), before an announcement written on a timer could arrive.
  it('waits the whole quiet window after an action that changes nothing at once', async () => {
    const context = await browser.newContext();
    await installPageScripts(context);
    const page = await context.newPage();
    await page.setContent('<div id="r" aria-live="polite"></div>');
    await page.waitForTimeout(SETTLE_OPTIONS.quietMs + 100);
    await drainAnnouncements(page);

    await page.evaluate(() => {
      setTimeout(() => (document.getElementById('r')!.textContent = 'Greg Fisher removed'), 150);
    });
    const result = await settle(page);

    expect(result.quiet).toBe(true);
    expect(result.ms).toBeGreaterThanOrEqual(SETTLE_OPTIONS.quietMs);
    expect((await drainAnnouncements(page)).map(({ text }) => text)).toEqual([
      'Greg Fisher removed',
    ]);
    await context.close();
  });

  // Dialog proposal, 2026-11-21: a focus guard may hand focus on from a timer without touching
  // the DOM. Quiet used to mean a still DOM only, so the step closed with focus on the guard.
  it('is not quiet while focus is still changing', async () => {
    const context = await browser.newContext();
    await installPageScripts(context);
    const page = await context.newPage();
    // A navigation, as in a measurement: setContent rewrites the document with document.open(),
    // which drops the listeners the page scripts put on it.
    const html = '<div id="guard" tabindex="0"></div><button id="first">Name</button>';
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);
    await page.waitForTimeout(SETTLE_OPTIONS.quietMs + 100);

    // One page call, so both times are read on the page's own clock.
    const result = await page.evaluate(async (options) => {
      let handedOnAt = 0;
      document.getElementById('guard')!.focus();
      setTimeout(() => {
        document.getElementById('first')!.focus();
        handedOnAt = performance.now();
      }, 300);
      const { quiet } = await window.__earshot.waitForQuiet(options);
      return { quiet, stillForMs: performance.now() - handedOnAt };
    }, SETTLE_OPTIONS);

    expect(result.quiet).toBe(true);
    // The window restarted when focus was handed on, 300 ms in: before, it closed at 400 ms.
    expect(result.stillForMs).toBeGreaterThanOrEqual(SETTLE_OPTIONS.quietMs);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('first');
    await context.close();
  });
});
