import type { FocusInfo, Measurement, Step } from '@earshot/contracts';
import { comboboxSteps, type ComboboxStep } from './combobox-replay';
import { menuSteps, type MenuStep } from './menu-replay';
import { dialogSteps, type DialogStep } from './dialog-replay';
import { selectSteps } from './select-replay';
import { stepKey } from './step-key';
import { tabsSteps, type TabsStep } from './tabs-replay';
import { basisWithReasons, type LaneVerdict } from './lane-verdict';

/**
 * Where focus was after a step, in the terms a replay draws: a chip by its place among the
 * chips, the text entry, the next control on the page, the page itself, or something else.
 */
export type ReplayFocus =
  | { kind: 'chip'; index: number; count: number; role: string; name: string }
  | { kind: 'input'; name: string }
  | { kind: 'outside'; role: string | null; name: string }
  | { kind: 'away' }
  | { kind: 'body' }
  | { kind: 'other'; role: string | null; name: string };

export interface ReplayStep {
  key: string;
  from: ReplayFocus;
  to: ReplayFocus;
  /** People whose chip left the field with this step. */
  removed: readonly string[];
  /** The semantic model's lines for this step, focus first, then announcements. */
  speech: readonly string[];
  /** Live region announcements among them. */
  heard: readonly string[];
  /**
   * Texts of live regions that entered the page with this step already holding them. Not among
   * the spoken lines: the engine records the region, not whether a screen reader speaks it.
   */
  arrived: readonly string[];
  /** Nodes that left and joined the accessibility tree, word for word: `button “Remove Irene Oh”`. */
  left: readonly string[];
  added: readonly string[];
  /**
   * Present for a pattern with a popup (combobox): the field, the list and its marks before and
   * after the step. A replay then draws the list, not chips.
   */
  combobox?: ComboboxStep;
  /** Present for a menu button: the button, the items and the page's last action. */
  menu?: MenuStep;
  /** Present for tabs: every tab, the shown panel and where focus is. */
  tabs?: TabsStep;
  /** Present for a dialog: whether it is open, by what name, and where focus is. */
  dialog?: DialogStep;
}

const named = (nodes: readonly { role: string | null; name: string }[]) =>
  nodes.flatMap(({ role, name }) => (name ? [`${role ?? 'node'} “${name}”`] : []));

const textEntryRoles: ReadonlySet<string> = new Set(['combobox', 'textbox', 'searchbox']);

/** Its place among the chips: the set position, or else its place among the adapter's items. */
function chipPlace(focus: FocusInfo): { index: number; count: number } | undefined {
  const index = focus.posInSet ?? focus.item?.index;
  const count = focus.setSize ?? focus.item?.count;
  return index !== undefined && count !== undefined ? { index, count } : undefined;
}

const isTextEntry = ({ role }: FocusInfo) => role !== null && textEntryRoles.has(role);

export function replayFocus(focus: FocusInfo): ReplayFocus {
  // The document no longer has focus: carried out of the page, which is not a loss.
  if (focus.leftPage) return { kind: 'away' };
  if (focus.isBody) return { kind: 'body' };
  if (!focus.isInsideComponent) return { kind: 'outside', role: focus.role, name: focus.name };
  if (isTextEntry(focus)) return { kind: 'input', name: focus.name };
  const place = chipPlace(focus);
  if (place) return { kind: 'chip', ...place, role: focus.role ?? 'none', name: focus.name };
  return { kind: 'other', role: focus.role, name: focus.name };
}

const mentions = (nodes: readonly { name: string }[], person: string) =>
  nodes.filter(({ name }) => name.includes(person)).length;

/**
 * A chip left when its name left the tree more often than it came back in the same step: a
 * re-render removes and adds the same node, which is not a removal. A chip leaves once.
 */
function removedBy(step: Step, people: readonly string[], gone: ReadonlySet<string>): string[] {
  return people.filter(
    (person) =>
      !gone.has(person) &&
      mentions(step.axDiff.removed, person) > mentions(step.axDiff.added, person),
  );
}

/** One run's steps as a replay. Run 1 is shown; runs are consistent or the verdict says so. */
export function replaySteps(
  steps: readonly Step[],
  people: readonly string[],
  pattern?: string,
): ReplayStep[] {
  const gone = new Set<string>();
  // The popup's side is read over the whole run: the field's text is carried from step to step.
  // A menu button recording carries the page's last action; a combobox recording does not.
  const menu = menuSteps(steps);
  const tabs = tabsSteps(steps);
  const dialog = dialogSteps(steps);
  const isOther = menu.length > 0 || tabs.length > 0 || dialog.length > 0;
  const popup = isOther ? [] : (pattern === 'select' ? selectSteps : comboboxSteps)(steps);
  const hasPopup = popup.length === steps.length;
  return steps.map((step, index) => {
    const removed = removedBy(step, people, gone);
    removed.forEach((person) => gone.add(person));
    return {
      key: stepKey(step),
      from: replayFocus(step.focusBefore),
      to: replayFocus(step.focusAfter),
      removed,
      speech: step.speech,
      heard: step.announcements.map(({ text }) => text),
      arrived: (step.insertedRegions ?? []).map(({ text }) => text),
      left: named(step.axDiff.removed),
      added: named(step.axDiff.added),
      ...(hasPopup && popup[index] ? { combobox: popup[index] } : {}),
      ...(menu[index] ? { menu: menu[index] } : {}),
      ...(tabs[index] ? { tabs: tabs[index] } : {}),
      ...(dialog[index] ? { dialog: dialog[index] } : {}),
    };
  });
}

export function scenarioReplay(
  measurement: Measurement,
  scenarioId: string,
  people: readonly string[],
): ReplayStep[] {
  const run = measurement.scenarios.find(({ id }) => id === scenarioId)?.runs[0];
  // A run whose setup failed has no steps to replay.
  return run?.status === 'completed' ? replaySteps(run.steps, people, measurement.pattern) : [];
}

export interface ReplayState {
  /** -1 is the starting state, before any key. */
  index: number;
  removed: readonly string[];
  focus: ReplayFocus;
  step: ReplayStep | undefined;
}

const startFocus = (steps: readonly ReplayStep[]): ReplayFocus =>
  steps[0]?.from ?? { kind: 'input', name: '' };

/** The field after `index` steps: who is gone, where focus is, and the step that got it there. */
export function replayStateAt(steps: readonly ReplayStep[], index: number): ReplayState {
  const played = steps.slice(0, Math.max(0, index + 1));
  return {
    index,
    removed: played.flatMap(({ removed }) => removed),
    focus: played.at(-1)?.to ?? startFocus(steps),
    step: index >= 0 ? steps[index] : undefined,
  };
}

/**
 * Said in place of a spoken line when a step ends with focus outside the page: the semantic
 * model speaks what focus lands on in the page's tree, and there it has nothing to read.
 */
export const notModelledWords = 'Not modelled: focus is outside the page';

/** True when the step ended with the document no longer holding focus (engine 0.18.0). */
export const endsOutsidePage = (step: ReplayStep): boolean => step.to.kind === 'away';

/**
 * The lines to show as spoken for a step. For a step that ends outside the page, only what a
 * live region announced: the recorded focus line names the document, which nobody hears there.
 */
export function spokenLines(step: ReplayStep): readonly string[] {
  return endsOutsidePage(step)
    ? step.speech.filter((line) => step.heard.includes(line))
    : step.speech;
}

/** The focused node as recorded: `button “Remove Irene Oh”`, the input, or the page. */
export function focusWords(focus: ReplayFocus): string {
  switch (focus.kind) {
    case 'away':
      return 'outside the page';
    case 'body':
      return 'the page';
    case 'input':
      return `the input “${focus.name}”`;
    case 'chip':
    case 'outside':
    case 'other':
      return `${focus.role ?? 'an element'} “${focus.name}”`;
  }
}

/** One system's recordings for the scenarios a page replays, with its verdicts: plain data. */
export interface ReplayLane {
  id: string;
  name: string;
  version: string;
  isReference: boolean;
  /**
   * False where the schematic cannot draw the recording faithfully (a deprecated component whose
   * removed token's name moves into the input); its steps are then shown as text, word for word.
   */
  isSchematic: boolean;
  steps: Readonly<Record<string, readonly ReplayStep[]>>;
  /** Each scenario's recorded starting state, such as "3 chips, empty input focused". */
  starts: Readonly<Record<string, string>>;
  /** Why a scenario has no steps: its first run's recorded reason (setup failed, errored). */
  failures: Readonly<Record<string, string>>;
  /** False for a system shown but never counted in agreement; `uncounted` then says why. */
  isCounted: boolean;
  /** The words after "Not counted:", from the targets file. */
  uncounted: string | undefined;
  verdicts: Readonly<Record<string, LaneVerdict>>;
}

interface LaneOptions {
  scenarioIds: readonly string[];
  people: readonly string[];
  isSchematic: boolean;
  /** Why the system is not counted in agreement; undefined when it is counted. */
  uncounted: string | undefined;
}

const failureOf = (scenario: Measurement['scenarios'][number]): string[] => {
  const run = scenario.runs[0];
  return run && run.status !== 'completed' ? [run.reason] : [];
};

export function replayLane(
  measurement: Measurement,
  { scenarioIds, people, isSchematic, uncounted }: LaneOptions,
): ReplayLane {
  const { target } = measurement;
  return {
    id: target.adapter,
    name: target.adapter === 'reference' ? 'Reference' : target.system,
    version: target.systemVersion.version,
    isReference: target.adapter === 'reference',
    isSchematic,
    steps: Object.fromEntries(
      scenarioIds.map((id) => [id, scenarioReplay(measurement, id, people)]),
    ),
    starts: Object.fromEntries(measurement.scenarios.map((s) => [s.id, s.initialState])),
    failures: Object.fromEntries(
      measurement.scenarios.flatMap((s) => failureOf(s).map((reason) => [s.id, reason])),
    ),
    isCounted: uncounted === undefined,
    uncounted,
    verdicts: Object.fromEntries(
      Object.entries(measurement.verdicts).map(([id, { verdict, summary, basis, reason }]) => [
        id,
        { verdict, summary, basis: basisWithReasons(basis ?? [], reason) },
      ]),
    ),
  };
}

export {
  decidingScenario,
  describeFallback,
  hasDecidingScenario,
  ruleWideResult,
  type LaneVerdict,
} from './lane-verdict';

export { describeStep } from './step-words';
