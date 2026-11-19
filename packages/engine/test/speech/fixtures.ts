import type { Announcement, FocusInfo } from '@earshot/contracts';

export function focus(overrides: Partial<FocusInfo> = {}): FocusInfo {
  return {
    role: 'combobox',
    name: 'To',
    states: {},
    isBody: false,
    isInsideComponent: true,
    path: '#to',
    ...overrides,
  };
}

export function announcement(text: string, politeness: Announcement['politeness']): Announcement {
  return { text, politeness, at: 0, insertedLate: false };
}
