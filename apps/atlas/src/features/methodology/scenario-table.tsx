import { scenarioLabelsOf } from '@/lib/scenario-labels';
import type { Measurement, Pattern, Scenario } from '@earshot/contracts';
import { Disclosure, Keycap } from '@/ui';
import { Part } from './how-we-measure';
import styles from './methodology.module.css';

/** The keys of the first completed run, as the engine pressed them. */
function keysOf(scenario: Scenario): string[] {
  const run = scenario.runs[0];
  if (run?.status !== 'completed') return [];
  return run.steps.map(({ action }) => {
    switch (action.type) {
      case 'press':
        return action.key;
      case 'click':
        return 'Click';
      case 'type':
        return 'Type';
    }
  });
}

/** The rules a scenario helps to judge, by title, from the recorded basis of each verdict. */
function rulesJudgedBy(scenarioId: string, pattern: Pattern, reference: Measurement): string[] {
  return pattern.rules
    .filter((rule) =>
      (reference.verdicts[rule.id]?.basis ?? []).some((entry) => entry.scenario === scenarioId),
    )
    .map(({ title }) => title);
}

interface ScenarioRowProps {
  scenario: Scenario;
  label: string;
  judges: readonly string[];
}

/** One scenario. Roles are written out: on a phone the row is restyled as a stacked record. */
function ScenarioRow({ scenario, label, judges }: ScenarioRowProps) {
  return (
    <tr role="row">
      <th scope="row" role="rowheader">
        {label}
      </th>
      <td role="cell" data-label="Starts from">
        {scenario.initialState}
      </td>
      <td role="cell" data-label="Keys">
        <span className={styles.keys}>
          {keysOf(scenario).map((key, index) => (
            <Keycap key={index} keys={key} size="sm" />
          ))}
        </span>
      </td>
      <td role="cell" data-label="Judges">
        {judges.join('; ')}
      </td>
    </tr>
  );
}

interface PatternScenarios {
  pattern: Pattern;
  /** The reference's file: every system runs the same scenarios, and this one completes them all. */
  reference: Measurement;
}

/** One pattern's scenarios, from the recorded file. */
function ScenarioTable({ pattern, reference }: PatternScenarios) {
  const labels = scenarioLabelsOf(pattern.id);
  return (
    <div className={styles.scroller}>
      <table className={`${styles.table} ${styles.stack}`} role="table">
        <caption className="visually-hidden">Scenarios for {pattern.name}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              Scenario
            </th>
            <th scope="col" role="columnheader">
              Starts from
            </th>
            <th scope="col" role="columnheader">
              Keys
            </th>
            <th scope="col" role="columnheader">
              Judges
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {reference.scenarios.map((scenario) => (
            <ScenarioRow
              key={scenario.id}
              scenario={scenario}
              label={labels[scenario.id] ?? scenario.id}
              judges={rulesJudgedBy(scenario.id, pattern, reference)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Every scenario of every pattern, from the recorded files: where it starts, the keys pressed
 * and the rules it judges. The same list runs against every system of a pattern, which is what
 * makes them comparable. Each pattern's list opens on its own: together they are some fifty
 * rows, and a reader comes for one pattern.
 */
export function Scenarios({ groups }: { groups: readonly PatternScenarios[] }) {
  return (
    <Part id="scenarios" title="The scenarios">
      <p>
        A scenario is a fixed sequence of keys or clicks from a known starting state. Every system
        measured for a pattern gets that pattern&rsquo;s scenarios, the same ones, so a difference
        between two systems is a difference in behavior, not in the test.
      </p>
      <div className={styles.disclosures}>
        {groups.map(({ pattern, reference }) => (
          <Disclosure
            key={pattern.id}
            label={`${pattern.name}: ${reference.scenarios.length} scenarios`}
            tone="row"
            isBare
          >
            <ScenarioTable pattern={pattern} reference={reference} />
          </Disclosure>
        ))}
      </div>
    </Part>
  );
}
