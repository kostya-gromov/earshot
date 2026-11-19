import { describe, expect, it } from 'vitest';
import { announcementsInWindow, type RawAnnouncement } from '../../src/model/announcements.ts';

const raw = (overrides: Partial<RawAnnouncement>): RawAnnouncement => ({
  text: 'Hiroshi Matsui removed. 2 selected',
  politeness: 'polite',
  t: 1010.4,
  regionInsertedAt: 12,
  ...overrides,
});

describe('announcementsInWindow', () => {
  const step = { start: 1000, end: 1120 };

  it('keeps announcements inside the step and times them from the action', () => {
    expect(announcementsInWindow([raw({})], step)).toEqual([
      {
        text: 'Hiroshi Matsui removed. 2 selected',
        politeness: 'polite',
        at: 10,
        insertedLate: false,
      },
    ]);
  });

  it('drops announcements from before or after the step', () => {
    expect(announcementsInWindow([raw({ t: 999 }), raw({ t: 1121 })], step)).toEqual([]);
  });

  it('flags a region that appeared during the step as inserted late', () => {
    const [late] = announcementsInWindow([raw({ regionInsertedAt: 1005 })], step);
    expect(late?.insertedLate).toBe(true);
  });
});
