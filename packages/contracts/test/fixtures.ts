import type { FocusInfo, Step } from '../src/index.ts';

/*
 * Object Mother: small factories that return valid data by default, so each test only
 * spells out the one thing it breaks. Returned as plain JSON-like objects because the
 * tests feed them through the schema, exactly like a data file would be.
 */

export const focus = (overrides: Partial<FocusInfo> = {}): FocusInfo => ({
  role: 'combobox',
  name: 'To',
  states: { expanded: false },
  isBody: false,
  isInsideComponent: true,
  ...overrides,
});

export const step = (overrides: Partial<Step> = {}): Step => ({
  action: { type: 'press', key: 'Backspace' },
  focusBefore: focus(),
  focusAfter: focus({
    role: 'button',
    name: 'Remove Hiroshi Matsui',
    posInSet: 3,
    setSize: 3,
    states: {},
  }),
  announcements: [],
  axDiff: { added: [], removed: [], changed: [] },
  settle: { ms: 34, quiet: true },
  speech: ['Remove Hiroshi Matsui, button, 3 of 3'],
  ...overrides,
});

const completedRun = () => ({ status: 'completed', steps: [step()] });

export function measuredSample() {
  return {
    schemaVersion: 1,
    pattern: 'input-with-chips',
    target: {
      system: 'Reference',
      systemVersion: { version: '0.1.0', source: 'packages/reference/package.json' },
      url: 'http://localhost:4173/input-with-chips/',
      adapter: 'reference',
      adapterVersion: 1,
    },
    provenance: {
      status: 'measured',
      engineVersion: '0.1.0',
      browser: 'chromium 140.0.0.0',
      os: 'linux',
      measuredAt: '2026-10-31T10:21:00Z',
      runs: 3,
      consistent: true,
    },
    scenarios: [
      {
        id: 'backspace-twice',
        rules: ['bsp'],
        initialState: '3 chips, focus in input',
        runs: [completedRun(), completedRun(), completedRun()],
      },
    ],
    verdicts: {
      bsp: {
        verdict: 'follows',
        summary: 'First press focuses, second removes',
        reason: "First Backspace moved focus to 'Remove Hiroshi Matsui'.",
      },
    },
  };
}
