import { describe, expect, it } from 'vitest';
import type { FocusInfo, Measurement, Step } from '@earshot/contracts';
import { behaviorContract } from '../../src/lib/behavior-contract';

const focus = (overrides: Partial<FocusInfo>): FocusInfo => ({
  role: 'combobox',
  name: 'To',
  states: {},
  isBody: false,
  isInsideComponent: true,
  path: 'p',
  ...overrides,
});

const step = (key: string, after: FocusInfo, announced: string[] = []): Step => ({
  action: { type: 'press', key },
  focusBefore: focus({}),
  focusAfter: after,
  announcements: announced.map((text) => ({
    text,
    politeness: 'polite',
    at: 1,
    insertedLate: false,
  })),
  axDiff: { added: [], removed: [], changed: [] },
  settle: { ms: 1, quiet: true },
  speech: [],
});

const measurement = {
  pattern: 'input-with-chips',
  provenance: { status: 'measured', engineVersion: '0.1.0' },
  scenarios: [
    {
      id: 'backspace-twice',
      rules: ['bsp', 'say'],
      initialState: '3 chips, empty input focused',
      runs: [
        {
          status: 'completed',
          steps: [
            step(
              'Backspace',
              focus({ role: 'button', name: 'Remove Hiroshi Matsui', posInSet: 3, setSize: 3 }),
            ),
            step('Tab', focus({ isInsideComponent: false, role: 'textbox', name: 'Subject' }), [
              'Hiroshi Matsui removed. 2 selected',
            ]),
          ],
        },
      ],
    },
  ],
} as unknown as Measurement;

const text = (lines: ReturnType<typeof behaviorContract>) =>
  lines.map((line) => line.map(({ text: part }) => part).join(''));

describe('behaviorContract', () => {
  it('names its source and the starting state, then each scenario with its rules', () => {
    expect(text(behaviorContract(measurement)).slice(0, 4)).toEqual([
      '# input-with-chips: built from reference.json, engine 0.1.0',
      'given  3 chips, empty input focused',
      '',
      'scenario backspace-twice  # rules: bsp, say',
    ]);
  });

  it('writes each step as key, where focus went and what was announced', () => {
    const [, , , , first, second] = text(behaviorContract(measurement));
    expect(first).toBe(
      '  press Backspace             → focus button “Remove Hiroshi Matsui”, 3 of 3',
    );
    expect(second).toBe(
      '  press Tab                   → focus leaves the field  says “Hiroshi Matsui removed. 2 selected”',
    );
  });

  it('marks focus and speech so they take the focus and heard colours', () => {
    const line = behaviorContract(measurement)[5] ?? [];
    expect(line.find(({ kind }) => kind === 'heard')?.text).toBe(
      '“Hiroshi Matsui removed. 2 selected”',
    );
    const first = behaviorContract(measurement)[4] ?? [];
    expect(first.find(({ kind }) => kind === 'focus')?.text).toBe('“Remove Hiroshi Matsui”');
  });
});

// A pattern with a popup: focus staying in the field is the one thing that never changes, so the
// contract says what did (design review 2026-11-15: forty lines read "focus combobox “Fruit”").
describe('behaviorContract for a pattern with a popup', () => {
  const option = (name: string) => ({ role: 'option', name, states: {} });
  const list = (...names: string[]) => ({ present: names.length > 0, options: names.map(option) });
  const withPopup = (base: Step, popup: NonNullable<Step['popup']>): Step => ({ ...base, popup });
  const field = (overrides: Partial<FocusInfo> = {}) =>
    focus({ name: 'Fruit', value: 'a', ...overrides });

  const combobox = {
    ...measurement,
    pattern: 'combobox',
    scenarios: [
      {
        id: 'accept',
        rules: ['enter'],
        initialState: 'empty, closed',
        runs: [
          {
            status: 'completed',
            steps: [
              withPopup(
                {
                  ...step('a', field(), ['3 suggestions']),
                  action: { type: 'type', text: 'a' },
                  focusBefore: field({ value: '' }),
                },
                { before: list(), after: list('Apple', 'Apricot', 'Avocado') },
              ),
              withPopup(
                {
                  ...step('ArrowDown', field({ activeDescendant: option('Apricot') })),
                  focusBefore: field(),
                },
                {
                  before: list('Apple', 'Apricot', 'Avocado'),
                  after: list('Apple', 'Apricot', 'Avocado'),
                },
              ),
              withPopup(
                { ...step('Enter', field({ value: 'Apricot' })), focusBefore: field() },
                { before: list('Apple', 'Apricot', 'Avocado'), after: list() },
              ),
              withPopup(step('Tab', focus({ isInsideComponent: false, name: 'Note' })), {
                before: list(),
                after: list(),
              }),
            ],
          },
        ],
      },
    ],
  } as unknown as Measurement;

  it('says once that focus stays in the field', () => {
    expect(text(behaviorContract(combobox))[2]).toBe(
      '# focus stays in the field unless a step says where it went',
    );
    // A pattern without a popup has no such line.
    expect(text(behaviorContract(measurement)).join('\n')).not.toContain('focus stays');
  });

  it('writes the list, the active option with its position, and a new value', () => {
    const lines = text(behaviorContract(combobox)).slice(5, 9);
    expect(lines).toEqual([
      '  type “a”                    → list open, 3 options, value “a”  says “3 suggestions”',
      '  press ArrowDown             → list open, 3 options, active “Apricot”, 2 of 3',
      '  press Enter                 → list closed, value “Apricot”',
      '  press Tab                   → focus leaves the field',
    ]);
  });

  it('says one option in the singular', () => {
    const one = structuredClone(combobox);
    const run = one.scenarios[0]?.runs[0];
    if (run?.status !== 'completed' || !run.steps[1]?.popup) throw new Error('fixture');
    run.steps[1].popup.after = list('Apricot');
    expect(text(behaviorContract(one))[6]).toContain(
      'list open, 1 option, active “Apricot”, 1 of 1',
    );
  });

  it('gives the active option the focus colour', () => {
    const line = behaviorContract(combobox)[6] ?? [];
    expect(line.find(({ kind }) => kind === 'focus')?.text).toBe('“Apricot”');
  });
});
