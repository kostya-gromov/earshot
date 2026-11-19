import type { Announcement, InsertedRegion } from '@earshot/contracts';

/** What the in-page recorder stores for each live region text change (times from performance.now()). */
export interface RawAnnouncement {
  text: string;
  politeness: 'polite' | 'assertive';
  t: number;
  /** When the region entered the DOM or became live. */
  regionInsertedAt: number;
}

/** A live region that entered the page already holding text (times from performance.now()). */
export interface RawInsertedRegion {
  text: string;
  politeness: 'polite' | 'assertive';
  t: number;
}

export interface StepWindow {
  /** Page time right before the action. */
  start: number;
  /** Page time after the page settled. */
  end: number;
}

/**
 * The announcements that belong to one step. A region is "inserted late" when it appeared
 * after the step's action started: created together with its message, which screen readers
 * often miss (ADR 0003, section 2).
 */
export function announcementsInWindow(
  raw: readonly RawAnnouncement[],
  { start, end }: StepWindow,
): Announcement[] {
  return raw
    .filter((a) => a.t >= start && a.t <= end)
    .map((a) => ({
      text: a.text,
      politeness: a.politeness,
      at: Math.round(a.t - start),
      insertedLate: a.regionInsertedAt >= start,
    }));
}

/** The regions that entered the page with text during one step. */
export function insertedRegionsInWindow(
  raw: readonly RawInsertedRegion[],
  { start, end }: StepWindow,
): InsertedRegion[] {
  return raw
    .filter((region) => region.t >= start && region.t <= end)
    .map(({ text, politeness }) => ({ text, politeness }));
}
