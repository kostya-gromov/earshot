import { chromium, type Browser, type BrowserContextOptions, type Page } from '@playwright/test';
import type { CDPSession } from '@playwright/test';
import { openCdp } from '../capture/cdp.ts';
import { installPageScripts } from '../capture/install.ts';

/** The fixed context every measurement runs in (packages/engine/CLAUDE.md, One run). Changing it changes results. */
export const MEASUREMENT_CONTEXT = {
  viewport: { width: 1280, height: 800 },
  locale: 'en-US',
  timezoneId: 'UTC',
  reducedMotion: 'reduce',
  colorScheme: 'light',
} as const satisfies BrowserContextOptions;

export interface Session {
  browser: Browser;
  page: Page;
  cdp: CDPSession;
  close: () => Promise<void>;
}

/** A fresh browser with recorders installed before any page script can run. */
export async function openSession({ headed = false } = {}): Promise<Session> {
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext(MEASUREMENT_CONTEXT);
  await installPageScripts(context);
  const page = await context.newPage();
  const cdp = await openCdp(page);
  return { browser, page, cdp, close: () => browser.close() };
}
