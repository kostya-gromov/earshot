import type { Pattern, TargetEntry } from '@earshot/contracts';
import type { LoadedMeasurement } from '@/data/measurements';
import { deprecatedAdapters, notCountedReasons } from '@/lib/agreement';
import { replayLane } from '@/lib/replay';
import { SectionHead } from '@/ui';
import { defaultCompared } from './compare-defaults';
import { CompareView } from './compare-view';
import styles from './matrix.module.css';
import { BrowserNative } from './browser-native';
import { matrixOf } from './matrix-data';
import { NotApplicable } from './not-applicable';
import { NotCounted } from './not-counted';
import { VerdictMatrix } from './verdict-matrix';
import type { GridScenario } from './replay-grid';

// The keys the grid replays for each pattern, each with the rule it shows best (design sketch F).
const gridScenariosByPattern: Readonly<Record<string, readonly GridScenario[]>> = {
  'input-with-chips': [
    { id: 'backspace-twice', label: 'Backspace twice', ruleId: 'bsp' },
    { id: 'arrows', label: 'Arrows', ruleId: 'arrows' },
    { id: 'delete-focused', label: 'Delete a chip', ruleId: 'say' },
    { id: 'remove-click', label: 'Click remove', ruleId: 'keep-focus' },
    { id: 'chip-shift-tab', label: 'Shift+Tab from a chip', ruleId: 'chip-stop' },
  ],
  combobox: [
    { id: 'type-then-move', label: 'Type, then arrows', ruleId: 'selected' },
    { id: 'open-down', label: 'Down Arrow, empty', ruleId: 'down' },
    { id: 'accept', label: 'Enter', ruleId: 'enter' },
    { id: 'escape', label: 'Escape', ruleId: 'escape' },
    { id: 'tab-open', label: 'Tab, list shown', ruleId: 'tab' },
  ],
  // The scenarios where the measured systems part: the disabled item, Tab, and the button's state.
  'menu-button': [
    { id: 'disabled', label: 'To the disabled item', ruleId: 'disabled' },
    { id: 'tab-open', label: 'Tab, menu shown', ruleId: 'tab' },
    { id: 'escape', label: 'Escape', ruleId: 'escape' },
    { id: 'activate', label: 'Enter on an item', ruleId: 'activate' },
    { id: 'ends', label: 'Arrows at both ends', ruleId: 'arrows' },
  ],
  // Where the measured systems part: the panel after Tab, and how a tab is activated.
  tabs: [
    { id: 'tab-out-text', label: 'Tab from a tab', ruleId: 'panel-reachable' },
    { id: 'activate-enter', label: 'Right Arrow, Enter', ruleId: 'activate' },
    { id: 'move', label: 'Arrows between tabs', ruleId: 'arrows' },
    { id: 'tab-in', label: 'Tab into the tabs', ruleId: 'tab-in' },
    { id: 'ends', label: 'Arrows at both ends', ruleId: 'wrap' },
  ],
  // Where the measured systems part: where focus lands, what a click behind does, what the
  // tree says about being modal.
  dialog: [
    { id: 'open', label: 'Enter on the button', ruleId: 'modal' },
    { id: 'outside-click', label: 'Click behind', ruleId: 'outside-inert' },
    { id: 'tab-forward', label: 'Tab, six times', ruleId: 'wrap' },
    { id: 'escape', label: 'Escape', ruleId: 'return-focus' },
  ],
  // Where the measured systems part: which option is selected, where DOM focus goes, what the
  // select is named, and the arrows at the end of the list.
  select: [
    { id: 'move', label: 'Arrows through the list', ruleId: 'selected' },
    { id: 'open', label: 'Down Arrow', ruleId: 'focus-stays' },
    { id: 'tab-in', label: 'Tab to the select', ruleId: 'name-and-value' },
    { id: 'enter', label: 'Down twice, Enter', ruleId: 'enter' },
    { id: 'escape', label: 'Down twice, Escape', ruleId: 'escape-keeps-value' },
  ],
};

interface SystemsSectionProps {
  pattern: Pattern;
  measurements: readonly LoadedMeasurement[];
  targets: readonly TargetEntry[];
  people: readonly string[];
}

/** "from 3 runs of the same 10 scenarios", said only when every file agrees on both counts. */
function countsOf(measured: readonly LoadedMeasurement[]): string {
  const runs = new Set(
    measured.map(({ measurement: m }) =>
      m.provenance.status === 'measured' ? m.provenance.runs : 0,
    ),
  );
  const scenarios = new Set(measured.map(({ measurement: m }) => m.scenarios.length));
  return runs.size === 1 && scenarios.size === 1
    ? ` from ${[...runs].join('')} runs of the same ${[...scenarios].join('')} scenarios in Chromium`
    : '';
}

/** Every rule against every system at a glance, then the picked systems replayed side by side. */
/**
 * "4 design systems counted and 2 shown, not counted": the same numbers as the summary at the top
 * of the page, which said 4 where this said 6 (first-visit review, 2026-11-25).
 */
function systemsWords(columns: number, setAside: number): string {
  const counted = columns - setAside;
  const systems = `${counted} design ${counted === 1 ? 'system' : 'systems'}`;
  return setAside > 0 ? `${systems} counted and ${setAside} shown, not counted` : systems;
}

export function SystemsSection({ pattern, measurements, targets, people }: SystemsSectionProps) {
  // Only status "measured" reaches the comparison (apps/atlas/CLAUDE.md).
  const measured = measurements.filter(
    ({ measurement }) => measurement.provenance.status === 'measured',
  );
  const notCounted = notCountedReasons(targets);
  const deprecated = deprecatedAdapters(targets);
  const { rows, columns } = matrixOf(pattern, measured, notCounted);
  const gridScenarios = gridScenariosByPattern[pattern.id] ?? [];
  const options = columns.map(({ id, name }) => ({ id, name }));
  return (
    <section className={styles.section} aria-labelledby="systems-title">
      <SectionHead
        id="systems-title"
        title="Every system, every rule."
        quiet="Then pick a few and watch the same keys."
        isSplit
      >
        {systemsWords(columns.length, columns.filter(({ id }) => notCounted.has(id)).length)},
        measured in their published packages. Each verdict comes{countsOf(measured)}.
        {rows.every(({ reference }) => reference === 'follows') &&
          ' The reference implementation follows every rule.'}
      </SectionHead>
      <VerdictMatrix rows={rows} columns={columns} />
      {/* Next to the columns it explains, not under the comparison (design review 2026-11-24). */}
      <BrowserNative entries={targets} />
      <CompareView
        options={options}
        fallback={defaultCompared(pattern, { measured, targets })}
        lanes={measured.map(({ measurement }) =>
          replayLane(measurement, {
            scenarioIds: gridScenarios.map(({ id }) => id),
            people,
            isSchematic: !deprecated.has(measurement.target.adapter),
            uncounted: notCounted.get(measurement.target.adapter),
          }),
        )}
        scenarios={gridScenarios}
        people={people}
      />
      <NotCounted
        systems={measured.flatMap(({ measurement: { target } }) => {
          const reason = notCounted.get(target.adapter);
          return reason ? [{ name: target.system, reason }] : [];
        })}
        planned={targets.flatMap((t) => (t.status === 'planned' ? [t.system] : []))}
      />
      <NotApplicable entries={targets} />
    </section>
  );
}
