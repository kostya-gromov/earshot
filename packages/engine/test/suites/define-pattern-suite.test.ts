import { describe, expect, it } from 'vitest';
import { inputWithChips } from '@earshot/contracts';
import type { PatternSuite } from '../../src/suites/types.ts';
import { definePatternSuite } from '../../src/suites/define-pattern-suite.ts';
import { inputWithChipsSuite } from '../../src/suites/input-with-chips.ts';

type State = { selectedItemCount: number };
type Interaction = 'second-remove-control';

const evaluator = () => ({
  verdict: 'follows' as const,
  summary: 'Behaves as expected',
  reason: 'Observed expected behavior.',
});

function suite(overrides: Partial<PatternSuite<State, Interaction>> = {}) {
  return {
    pattern: inputWithChips,
    scenarios: [
      {
        id: 'all-rules',
        rules: ['chip-stop', 'chip-arrows', 'tab', 'arrows', 'bsp', 'keep-focus', 'say', 'count'],
        requestedStateDescription: '3 selected items, empty focused input',
        initialState: { selectedItemCount: 3 },
        steps: [{ type: 'press' as const, key: 'Tab' }],
      },
    ],
    evaluators: {
      'chip-stop': evaluator,
      'chip-arrows': evaluator,
      tab: evaluator,
      bsp: evaluator,
      arrows: evaluator,
      'keep-focus': evaluator,
      say: evaluator,
      count: evaluator,
    },
    targets: [
      {
        id: 'reference',
        open: () => Promise.reject(new Error('Not used by suite validation.')),
      },
    ],
    ...overrides,
  } satisfies PatternSuite<State, Interaction>;
}

describe('definePatternSuite', () => {
  it('registers the production input-with-chips suite', () => {
    expect(inputWithChipsSuite.pattern.id).toBe('input-with-chips');
    expect(inputWithChipsSuite.scenarios).toHaveLength(10);
    expect(inputWithChipsSuite.targets.map(({ id }) => id)).toEqual([
      'reference',
      'atlassian',
      'fluent',
      'primer',
      'mui',
      'react-aria',
      'chakra',
    ]);
  });

  it('accepts a complete suite', () => {
    const value = suite();
    expect(definePatternSuite(value)).toBe(value);
  });

  it('rejects duplicate scenario ids', () => {
    const scenario = suite().scenarios[0]!;
    expect(() => definePatternSuite(suite({ scenarios: [scenario, scenario] }))).toThrow(
      'Duplicate scenario id "all-rules"',
    );
  });

  it('parses scenario ids, rule ids, and descriptions at registration', () => {
    const base = suite().scenarios[0]!;
    expect(() => definePatternSuite(suite({ scenarios: [{ ...base, id: 'Not valid' }] }))).toThrow(
      'Use lowercase kebab-case',
    );
    expect(() =>
      definePatternSuite(suite({ scenarios: [{ ...base, rules: ['Not valid'] }] })),
    ).toThrow('Use lowercase kebab-case');
    expect(() =>
      definePatternSuite(suite({ scenarios: [{ ...base, requestedStateDescription: '   ' }] })),
    ).toThrow();
  });

  it('rejects unknown scenario rules', () => {
    const scenario = { ...suite().scenarios[0]!, rules: ['unknown'] };
    expect(() => definePatternSuite(suite({ scenarios: [scenario] }))).toThrow(
      'Scenario "all-rules" references unknown rule "unknown"',
    );
  });

  it('rejects empty rules and steps', () => {
    const base = suite().scenarios[0]!;
    expect(() => definePatternSuite(suite({ scenarios: [{ ...base, rules: [] }] }))).toThrow(
      'Scenario "all-rules" must cover at least one rule',
    );
    expect(() => definePatternSuite(suite({ scenarios: [{ ...base, steps: [] }] }))).toThrow(
      'Scenario "all-rules" must contain at least one step',
    );
  });

  it('requires one evaluator and one scenario for every pattern rule', () => {
    const { say: _, ...withoutSay } = suite().evaluators;
    expect(() => definePatternSuite(suite({ evaluators: withoutSay }))).toThrow(
      'Missing evaluator for rule "say"',
    );
    expect(() =>
      definePatternSuite(
        suite({
          scenarios: [
            {
              ...suite().scenarios[0]!,
              rules: ['chip-stop', 'chip-arrows', 'tab', 'bsp', 'arrows', 'keep-focus'],
            },
          ],
        }),
      ),
    ).toThrow('No scenario covers rule "say"');
  });

  it('rejects evaluators for unknown rules and duplicate targets', () => {
    expect(() =>
      definePatternSuite(suite({ evaluators: { ...suite().evaluators, unknown: evaluator } })),
    ).toThrow('Evaluator references unknown rule "unknown"');

    const target = suite().targets[0]!;
    expect(() => definePatternSuite(suite({ targets: [target, target] }))).toThrow(
      'Duplicate target id "reference"',
    );
  });
});
