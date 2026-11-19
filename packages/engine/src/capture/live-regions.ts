import type { Page } from '@playwright/test';
import type { RawAnnouncement, RawInsertedRegion } from '../model/announcements.ts';

/*
 * Live region announcements are recorded in the page by live-region-recorder.ts. Only the
 * main frame's buffer is read: adapters open Storybook stories directly (iframe.html), so
 * the component is in the main frame.
 */

export const pageNow = (page: Page): Promise<number> => page.evaluate(() => window.__earshot.now());

export const drainAnnouncements = (page: Page): Promise<RawAnnouncement[]> =>
  page.evaluate(() => window.__earshot.drainAnnouncements());

export const drainInsertedRegions = (page: Page): Promise<RawInsertedRegion[]> =>
  page.evaluate(() => window.__earshot.drainInsertedRegions());
