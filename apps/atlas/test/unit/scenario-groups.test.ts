import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Measurement } from '@earshot/contracts';
import { basisWithReasons } from '../../src/lib/lane-verdict';
import { groupScenarios, type ScenarioResult } from '../../src/lib/scenario-groups';

const ids = (...names: string[]) => names.map((id) => ({ id }));
const result = (scenario: string, reason: string, extra: Partial<ScenarioResult> = {}) => ({
  scenario,
  verdict: 'follows',
  summary: 'Matches',
  reason,
  ...extra,
});
const shape = (rows: ReturnType<typeof groupScenarios<{ id: string }>>) =>
  rows.map(({ scenario, same }) => [scenario.id, same.map(({ id }) => id)]);
const five = ids('a', 'b', 'c', 'd', 'e');

describe('groupScenarios', () => {
  it('folds scenarios whose verdict, summary and reason are the same word for word', () => {
    const results = [
      result('a', 'Same.'),
      result('b', 'Same.'),
      result('c', 'Other.'),
      result('d', 'Same.'),
      result('e', 'Same.'),
    ];
    expect(shape(groupScenarios(five, results, undefined))).toEqual([
      ['a', ['b', 'd', 'e']],
      ['c', []],
    ]);
  });

  it('sets a scenario’s own step counts aside when it compares, and no other number', () => {
    const steps = (judged: number, recorded: number) => ({
      judgedSteps: judged,
      recordedSteps: recorded,
    });
    const results = [
      result('a', 'Matched after each of the 3 steps judged (0 not judged).', steps(3, 3)),
      result('b', 'Matched after each of the 5 steps judged (1 not judged).', steps(5, 6)),
      result('c', 'Matched after each of the 2 steps judged (0 not judged).', steps(2, 2)),
      result('d', 'Matched after each of the 4 steps judged (0 not judged).', steps(4, 4)),
      // The same words with another number that is not a step count: not alike.
      result('e', 'Matched after each of the 3 steps judged (0 not judged) of 7.', steps(3, 3)),
    ];
    expect(shape(groupScenarios(five, results, undefined))).toEqual([
      ['a', ['b', 'c', 'd']],
      ['e', []],
    ]);
  });

  it('compares word for word where the file records no step count', () => {
    const results = ['a', 'b', 'c', 'd'].map((id, index) => result(id, `In ${index + 1} steps.`));
    expect(shape(groupScenarios(ids('a', 'b', 'c', 'd'), results, undefined))).toHaveLength(4);
  });

  it('keeps apart the same reason under another verdict or another summary', () => {
    const results = [
      result('a', 'Same.'),
      result('b', 'Same.', { verdict: 'differs' }),
      result('c', 'Same.', { summary: 'Something else' }),
      result('d', 'Same.'),
      result('e', 'Same.'),
    ];
    expect(shape(groupScenarios(five, results, undefined))).toHaveLength(5);
  });

  it('never folds the scenario that decided the verdict: it leads its group', () => {
    const results = ['a', 'b', 'c', 'd'].map((id) => result(id, 'Same.'));
    expect(shape(groupScenarios(ids('a', 'b', 'c', 'd'), results, 'c'))).toEqual([
      ['c', ['a', 'b', 'd']],
    ]);
  });

  it('shows three alike in full: a fold has to hide at least three rows', () => {
    const results = [result('a', 'Same.'), result('b', 'Same.'), result('c', 'Same.')];
    expect(shape(groupScenarios(ids('a', 'b', 'c'), results, undefined))).toHaveLength(3);
  });

  it('never folds a scenario with no result or no reason of its own', () => {
    const results = ['a', 'b', 'c', 'd'].map((id) => result(id, ''));
    expect(shape(groupScenarios(five, results, undefined))).toHaveLength(5);
  });
});

// The same rule on what the engine really wrote: in every fold of every rule, system and
// pattern, the reasons are one sentence once each scenario's step counts are put back as "#".
describe('folds in the measured files', () => {
  const root = path.join(import.meta.dirname, '../../../../data', 'measurements');
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((name) =>
    name.endsWith('.json'),
  );
  const masked = ({ reason, judgedSteps, recordedSteps }: ScenarioResult) => {
    const counts = new Set([judgedSteps, (recordedSteps ?? 0) - (judgedSteps ?? 0)]);
    return reason.replace(/\d+/g, (digits) => (counts.has(Number(digits)) ? '#' : digits));
  };

  /** Every fold of one measurement file: the rule it is in and the results it holds. */
  function foldsIn(file: string) {
    const measurement = Measurement.parse(JSON.parse(readFileSync(path.join(root, file), 'utf8')));
    const recorded = new Map(
      measurement.scenarios.map(({ id, runs }) => [
        id,
        runs[0]?.status === 'completed' ? runs[0].steps.length : undefined,
      ]),
    );
    return Object.entries(measurement.verdicts).flatMap(([rule, verdict]) => {
      const results = basisWithReasons(verdict.basis ?? [], verdict.reason).map((entry) => ({
        ...entry,
        recordedSteps: recorded.get(entry.scenario),
      }));
      const scenarios = results.map(({ scenario }) => ({ id: scenario }));
      return groupScenarios(scenarios, results, undefined)
        .filter(({ same }) => same.length > 0)
        .map(({ scenario, same }) => ({
          where: `${file}, ${rule}`,
          group: [scenario, ...same].flatMap(({ id }) =>
            results.filter((entry) => entry.scenario === id),
          ),
        }));
    });
  }

  it('hold only scenarios whose reasons differ in nothing but their step counts', () => {
    const folds = files.flatMap(foldsIn);
    for (const { where, group } of folds) {
      expect([...new Set(group.map(masked))], where).toHaveLength(1);
      expect([...new Set(group.map(({ summary }) => summary))], where).toHaveLength(1);
      // Every scenario of a fold gives its count: the rows and the label are built from it.
      expect(
        group.every(({ judgedSteps }) => judgedSteps !== undefined),
        where,
      ).toBe(true);
    }
    // The rule about the expanded state folds in combobox and in the menu button.
    expect(folds.length).toBeGreaterThan(0);
  });
});
