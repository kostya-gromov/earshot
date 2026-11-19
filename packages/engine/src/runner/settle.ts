import type { Page } from '@playwright/test';
import type { Settle } from '@earshot/contracts';

/**
 * ADR 0003, section 5 (amended 2026-11-13). Part of what a measurement means: changing these
 * changes results. 400 ms, because announcement libraries write their text late on purpose
 * (Zag's live region: at least 100 ms), and a window of the same length closed the step first.
 */
export const SETTLE_OPTIONS = { quietMs: 400, capMs: 1000 } as const;

/** Waits until the page is quiet after an action, or the cap is hit (`quiet: false`). */
export const settle = (page: Page): Promise<Settle> =>
  page.evaluate((options) => window.__earshot.waitForQuiet(options), SETTLE_OPTIONS);
