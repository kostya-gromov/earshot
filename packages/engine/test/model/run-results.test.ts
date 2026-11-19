import type { Run, Step, VerdictResult } from '@earshot/contracts';
import { describe, expect, it } from 'vitest';
import type { Evaluator } from '../../src/model/evaluator.ts';
import { aggregateRuleVerdicts, summarizeRule } from '../../src/model/rule-verdict.ts';
import { evaluateScenarioRuns } from '../../src/model/run-results.ts';
import { focus, step } from '../evaluators/input-with-chips/fixtures.ts';

const completed = (value: Step): Run => ({ status: 'completed', steps: [value] });
const follows: Evaluator = () => ({
  verdict: 'follows',
  summary: 'Behaves as expected',
  reason: 'Observed expected behavior.',
});

describe('evaluateScenarioRuns', () => {
  it('treats timing and focus paths as nondeterministic fields', () => {
    const first = step({
      focusAfter: focus({ path: '#first' }),
      announcements: [{ text: 'Removed', politeness: 'polite', at: 1, insertedLate: false }],
      settle: { ms: 20, quiet: true },
    });
    const second = step({
      focusAfter: focus({ path: '#second' }),
      announcements: [{ text: 'Removed', politeness: 'polite', at: 50, insertedLate: false }],
      settle: { ms: 90, quiet: true },
    });

    expect(
      evaluateScenarioRuns({
        scenarioId: 'remove',
        ruleIds: ['say'],
        runs: [completed(first), completed(second)],
        evaluators: { say: follows },
      }),
    ).toEqual({
      consistent: true,
      verdicts: {
        say: {
          verdict: 'follows',
          summary: 'Behaves as expected',
          reason: 'Observed expected behavior.',
        },
      },
      fatalErrors: [],
    });
  });

  it('marks semantic disagreement as flaky', () => {
    const result = evaluateScenarioRuns({
      scenarioId: 'remove',
      ruleIds: ['say'],
      runs: [
        completed(step()),
        completed(step({ focusAfter: focus({ role: 'button', name: 'Other' }) })),
      ],
      evaluators: { say: follows },
    });

    expect(result.consistent).toBe(false);
    expect(result.verdicts.say?.verdict).toBe('inconclusive');
    expect(result.verdicts.say?.reason).toContain('flaky');
  });

  it('marks setup failures inconclusive without calling evaluators', () => {
    const evaluator: Evaluator = () => {
      throw new Error('must not run');
    };
    const result = evaluateScenarioRuns({
      scenarioId: 'remove',
      ruleIds: ['say'],
      runs: [{ status: 'setup-failed', reason: 'Input not found' }],
      evaluators: { say: evaluator },
    });

    // Changed 2026-11-10 (second verdict audit): a setup that fails the same way in every run is
    // a repeatable outcome, not flakiness, and its own reason is what the reader needs.
    expect(result.consistent).toBe(true);
    expect(result.verdicts.say).toEqual({
      verdict: 'inconclusive',
      summary: 'Could not reach the starting state',
      reason: 'Input not found',
    });
    expect(result.fatalErrors).toEqual([]);
  });

  it('stays inconsistent when only some runs fail setup, or fail it differently', () => {
    const completed = { status: 'completed' as const, steps: [] };
    for (const runs of [
      [{ status: 'setup-failed' as const, reason: 'Input not found' }, completed],
      [
        { status: 'setup-failed' as const, reason: 'Input not found' },
        { status: 'setup-failed' as const, reason: 'Timed out' },
      ],
    ]) {
      const result = evaluateScenarioRuns({
        scenarioId: 'remove',
        ruleIds: ['say'],
        runs,
        evaluators: { say: () => ({ verdict: 'follows', summary: 's', reason: 'r' }) },
      });
      expect(result.consistent).toBe(false);
    }
  });

  it('keeps evaluator exceptions outside target evidence', () => {
    const evaluator: Evaluator = () => {
      throw new Error('Evaluator bug');
    };
    const result = evaluateScenarioRuns({
      scenarioId: 'remove',
      ruleIds: ['say'],
      runs: [completed(step())],
      evaluators: { say: evaluator },
    });

    expect(result.verdicts.say).toEqual({
      verdict: 'inconclusive',
      summary: 'Evaluation did not complete',
      reason: 'Evaluation did not complete.',
    });
    expect(result.fatalErrors).toEqual(['say: Evaluator bug']);
  });
});

describe('aggregateRuleVerdicts', () => {
  const result = (verdict: VerdictResult['verdict']): VerdictResult => ({
    verdict,
    summary: `${verdict} summary`,
    reason: verdict,
  });
  const entry = (scenarioId: string, verdict: VerdictResult['verdict'], reliable = true) => ({
    scenarioId,
    result: result(verdict),
    reliable,
  });

  it('lets a stable difference outrank follows', () => {
    expect(
      aggregateRuleVerdicts('tab', [entry('tab-out', 'follows'), entry('tab-from-chip', 'differs')])
        .verdict,
    ).toBe('differs');
  });

  // Verdict audit 2026-11-14: a difference in one scenario read as a difference in all.
  it('names the scenarios that follow next to the one that differs', () => {
    expect(
      aggregateRuleVerdicts('tab', [entry('tab-out', 'follows'), entry('tab-from-chip', 'differs')])
        .reason,
    ).toBe('[tab-from-chip] differs Follows in: [tab-out] follows');
  });

  it('lets a stable difference outrank a scenario that could not judge the rule', () => {
    expect(
      aggregateRuleVerdicts('tab', [
        entry('tab-out', 'inconclusive'),
        entry('shift-tab-out', 'differs'),
      ]),
    ).toEqual({
      verdict: 'differs',
      // The deciding scenario's phrase stands for the rule; unjudged ones stay in the reason.
      summary: 'differs summary',
      reason: '[shift-tab-out] differs Not judged: [tab-out] inconclusive',
      basis: [
        { scenario: 'tab-out', verdict: 'inconclusive', summary: 'inconclusive summary' },
        { scenario: 'shift-tab-out', verdict: 'differs', summary: 'differs summary' },
      ],
    });
  });

  it('stays inconclusive when any covering scenario had unreliable runs', () => {
    expect(
      aggregateRuleVerdicts('tab', [
        entry('tab-out', 'inconclusive', false),
        entry('shift-tab-out', 'differs'),
      ]),
    ).toEqual({
      verdict: 'inconclusive',
      summary: 'inconclusive summary',
      reason: '[tab-out] inconclusive',
      basis: [
        { scenario: 'tab-out', verdict: 'inconclusive', summary: 'inconclusive summary' },
        { scenario: 'shift-tab-out', verdict: 'differs', summary: 'differs summary' },
      ],
    });
  });

  // Amendment 2026-11-11 (ADR 0004): React Aria's click removal kept focus in the field, but the
  // rule read "Nothing removed to judge" because its key scenarios removed nothing. A scenario
  // that follows stands on its own, as a difference does; unjudged ones stay in the reason.
  it('lets a scenario that follows outrank scenarios that could not judge the rule', () => {
    expect(
      aggregateRuleVerdicts('keep-focus', [
        entry('backspace-twice', 'inconclusive'),
        entry('remove-click', 'follows'),
      ]),
    ).toEqual({
      verdict: 'follows',
      summary: 'follows summary',
      reason: '[remove-click] follows Not judged: [backspace-twice] inconclusive',
      basis: [
        { scenario: 'backspace-twice', verdict: 'inconclusive', summary: 'inconclusive summary' },
        { scenario: 'remove-click', verdict: 'follows', summary: 'follows summary' },
      ],
    });
  });

  it('stays inconclusive when no scenario could judge the rule', () => {
    expect(
      aggregateRuleVerdicts('keep-focus', [
        entry('backspace-twice', 'inconclusive'),
        entry('delete-focused', 'inconclusive'),
      ]).verdict,
    ).toBe('inconclusive');
  });

  it('still lets a difference outrank follows when some scenarios could not judge', () => {
    expect(
      aggregateRuleVerdicts('keep-focus', [
        entry('backspace-twice', 'inconclusive'),
        entry('delete-focused', 'follows'),
        entry('remove-click', 'differs'),
      ]).verdict,
    ).toBe('differs');
  });

  it('returns not-applicable only when every scenario is not applicable', () => {
    expect(
      aggregateRuleVerdicts('tab', [
        entry('first', 'not-applicable'),
        entry('second', 'not-applicable'),
      ]).verdict,
    ).toBe('not-applicable');
  });

  it('identifies each scenario in the aggregated reason', () => {
    expect(
      aggregateRuleVerdicts('tab', [entry('tab-out', 'differs'), entry('tab-from-chip', 'differs')])
        .reason,
    ).toBe('[tab-out] differs [tab-from-chip] differs');
  });

  // Verdict audit 2026-11-09: React Aria's "count" read "Nothing removed to count" although
  // its click removal did remove a chip, unannounced. Every distinct reason is named.
  it('names every distinct reason when scenarios could not judge for different reasons', () => {
    const unjudged = (scenarioId: string, summary: string) => ({
      scenarioId,
      result: { verdict: 'inconclusive' as const, summary, reason: summary },
      reliable: true,
    });
    expect(
      aggregateRuleVerdicts('count', [
        unjudged('backspace-twice', 'Nothing removed'),
        unjudged('delete-focused', 'Nothing removed'),
        unjudged('remove-click', 'Removal not announced'),
      ]).summary,
    ).toBe('Nothing removed; removal not announced');
  });

  it('keeps the summary short when the reasons do not fit, and names how many more', () => {
    const long = (scenarioId: string, summary: string) => ({
      scenarioId,
      result: { verdict: 'inconclusive' as const, summary, reason: summary },
      reliable: true,
    });
    expect(
      aggregateRuleVerdicts('count', [
        long('a', 'The first reason is a fairly long phrase'),
        long('b', 'And the second one is long as well'),
      ]).summary,
    ).toBe('The first reason is a fairly long phrase (+1 more)');
  });
});

// Verdict audit 2026-11-17: a rule about Tab and Shift+Tab was summarised by one key's phrase,
// "Tab leaves the chips", for a system that follows it with both.
describe('summarizeRule', () => {
  const entry = (scenarioId: string, verdict: VerdictResult['verdict']) => ({
    scenarioId,
    result: { verdict, summary: `${scenarioId} summary`, reason: verdict },
    reliable: true,
  });
  const phrase = 'The chips are one Tab stop';

  it('says the rule in its own words when every scenario follows', () => {
    const verdict = aggregateRuleVerdicts('chip-stop', [
      entry('chip-tab', 'follows'),
      entry('chip-shift-tab', 'follows'),
    ]);
    const summarized = summarizeRule(verdict, phrase);
    expect(summarized.summary).toBe(phrase);
    // What each scenario says of its own key stays as recorded.
    expect(summarized.basis?.map(({ summary }) => summary)).toEqual([
      'chip-tab summary',
      'chip-shift-tab summary',
    ]);
    expect(summarized.reason).toBe(verdict.reason);
  });

  it('keeps the deciding scenario’s words when one differs or was not judged', () => {
    for (const other of ['differs', 'inconclusive'] as const) {
      const verdict = aggregateRuleVerdicts('chip-stop', [
        entry('chip-tab', other),
        entry('chip-shift-tab', 'follows'),
      ]);
      expect(summarizeRule(verdict, phrase)).toEqual(verdict);
    }
  });

  it('changes nothing for a rule with no phrase of its own', () => {
    const verdict = aggregateRuleVerdicts('tab', [entry('tab-out', 'follows')]);
    expect(summarizeRule(verdict, undefined)).toEqual(verdict);
  });
});
