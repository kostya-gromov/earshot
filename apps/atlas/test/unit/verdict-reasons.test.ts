import { describe, expect, it } from 'vitest';
import type { Measurement } from '@earshot/contracts';
import { reasonsByScenario, scenariosForRule } from '../../src/lib/verdict-reasons';

describe('reasonsByScenario', () => {
  it('splits a reason into one entry per scenario, in the order the evaluator wrote them', () => {
    expect(reasonsByScenario('[a-one] First moved. [b-two] Second stayed.')).toEqual([
      { scenarioId: 'a-one', text: 'First moved.', isJudged: true },
      { scenarioId: 'b-two', text: 'Second stayed.', isJudged: true },
    ]);
  });

  it('marks every scenario after "Not judged:" as not judged', () => {
    const reason =
      '[shift-tab-out] Shift+Tab moved focus inside. Not judged: [tab-out] Tab reached the document. [tab-from-chip] ArrowLeft did not focus a chip.';
    expect(reasonsByScenario(reason)).toEqual([
      { scenarioId: 'shift-tab-out', text: 'Shift+Tab moved focus inside.', isJudged: true },
      { scenarioId: 'tab-out', text: 'Tab reached the document.', isJudged: false },
      { scenarioId: 'tab-from-chip', text: 'ArrowLeft did not focus a chip.', isJudged: false },
    ]);
  });

  it('keeps a reason without scenario markers whole rather than dropping it', () => {
    expect(reasonsByScenario('Setup could not add three chips.')).toEqual([
      { scenarioId: undefined, text: 'Setup could not add three chips.', isJudged: true },
    ]);
  });
});

describe('scenariosForRule', () => {
  const scenario = (id: string, rules: string[]) => ({ id, rules, initialState: 's', runs: [] });
  const measurement = {
    scenarios: [
      scenario('tab-out', ['tab']),
      scenario('shift-tab-out', ['tab']),
      scenario('backspace-twice', ['bsp', 'say']),
      scenario('tab-from-chip', ['tab']),
    ],
    verdicts: {
      tab: {
        verdict: 'differs',
        summary: 's',
        reason: '[shift-tab-out] Moved inside. Not judged: [tab-out] Reached the document.',
      },
    },
  } as unknown as Measurement;

  it('lists the deciding scenario first and the ones the reason does not name last', () => {
    expect(scenariosForRule(measurement, 'tab').map(({ scenario: s }) => s.id)).toEqual([
      'shift-tab-out',
      'tab-out',
      'tab-from-chip',
    ]);
  });

  it('pairs each scenario with its own part of the reason', () => {
    const [first, second, third] = scenariosForRule(measurement, 'tab');
    expect(first?.reason?.text).toBe('Moved inside.');
    expect(second?.reason?.isJudged).toBe(false);
    expect(third?.reason).toBeUndefined();
  });
});
