import type { FocusInfo, Measurement, PopupState, Step } from '@earshot/contracts';

/**
 * A combobox recording in the terms a replay draws: the text in the field, whether it says it is
 * expanded, the options in the popup with their marks, and where focus is. Every field is what
 * the engine recorded; nothing is inferred from a system's design.
 */
export type ComboboxFocus =
  | { kind: 'combobox'; name: string }
  | { kind: 'option'; index: number; name: string }
  | { kind: 'outside'; role: string | null; name: string }
  | { kind: 'other'; role: string | null; name: string }
  | { kind: 'away' }
  | { kind: 'body' };

export interface ComboboxOption {
  name: string;
  /** Exposed as selected in the accessibility tree. */
  isSelected: boolean;
  /** Named by the combobox's aria-activedescendant, or holding DOM focus. */
  isActive: boolean;
}

export interface ComboboxMoment {
  focus: ComboboxFocus;
  /** The text in the field; undefined while focus is not on a text field. */
  value: string | undefined;
  /** The focused element's expanded state; undefined when it exposes none. */
  isExpanded: boolean | undefined;
  /** False when no popup is in the accessibility tree. */
  hasPopup: boolean;
  options: readonly ComboboxOption[];
  /** aria-activedescendant is set and names nothing in the tree. */
  pointsNowhere: boolean;
}

export interface ComboboxStep {
  /** The key pressed, or the text typed in quotes: `ArrowDown`, `“a”`. */
  key: string;
  before: ComboboxMoment;
  after: ComboboxMoment;
  /** The semantic model's lines for this step. */
  speech: readonly string[];
  /** Text written into a live region in this step. */
  written: readonly string[];
  /** Live regions that entered the page already holding text. */
  inserted: readonly string[];
}

const textEntryRoles: ReadonlySet<string> = new Set(['combobox', 'textbox', 'searchbox']);

function comboboxFocus(focus: FocusInfo, popup: PopupState): ComboboxFocus {
  // The document no longer has focus: carried out of the page, which is not a loss.
  if (focus.leftPage) return { kind: 'away' };
  if (focus.isBody) return { kind: 'body' };
  const option = focus.item && popup.options[focus.item.index - 1];
  if (focus.item && option) return { kind: 'option', index: focus.item.index, name: option.name };
  if (!focus.isInsideComponent) return { kind: 'outside', role: focus.role, name: focus.name };
  if (focus.role !== null && textEntryRoles.has(focus.role)) {
    return { kind: 'combobox', name: focus.name };
  }
  return { kind: 'other', role: focus.role, name: focus.name };
}

function activeName(focus: FocusInfo, popup: PopupState): string | undefined {
  const named = focus.activeDescendant;
  if (named?.role === 'option') return named.name;
  return focus.item ? popup.options[focus.item.index - 1]?.name : undefined;
}

interface MomentParts {
  focus: FocusInfo;
  popup: PopupState;
  /** The text in the combobox, known from focus on it or carried from an earlier step. */
  value: string | undefined;
}

function moment({ focus, popup, value }: MomentParts): ComboboxMoment {
  const active = activeName(focus, popup);
  return {
    focus: comboboxFocus(focus, popup),
    value,
    isExpanded: focus.states.expanded,
    hasPopup: popup.present,
    options: popup.options.map(({ name, states }) => ({
      name,
      isSelected: states.selected === true,
      isActive: name === active,
    })),
    pointsNowhere: focus.activeDescendantUnresolved === true,
  };
}

/** Focus is on the combobox itself, so the recorded value is the combobox's own. */
const isOnField = (focus: FocusInfo): boolean =>
  focus.isInsideComponent && !focus.item && focus.role !== null && textEntryRoles.has(focus.role);

/**
 * The combobox's text after a step. While focus is on it, that is the focused field's value.
 * Once focus has left, the focused element is another control, whose value says nothing about
 * the combobox: its text is then what it was, unless the tree recorded a change of its value
 * (a system may fill in or clear the field as focus leaves).
 */
function valueAfter(step: Step, before: string | undefined): string | undefined {
  if (isOnField(step.focusAfter)) return step.focusAfter.value;
  const change = step.axDiff.changed.findLast(
    ({ node, property }) =>
      property === 'value' && node.role !== null && textEntryRoles.has(node.role),
  );
  if (!change) return before;
  return typeof change.after === 'string' ? change.after : '';
}

const keyOf = ({ action }: Step): string => {
  switch (action.type) {
    case 'press':
      return action.key;
    case 'type':
      return `“${action.text}”`;
    case 'click':
      return 'Click';
  }
};

/** One run's steps as a combobox replay. Steps recorded without a popup are left out. */
export function comboboxSteps(steps: readonly Step[]): ComboboxStep[] {
  let known: string | undefined;
  return steps.flatMap((step) => {
    if (!step.popup) return [];
    const before = isOnField(step.focusBefore) ? step.focusBefore.value : known;
    const after = valueAfter(step, before);
    known = after;
    return [
      {
        key: keyOf(step),
        before: moment({ focus: step.focusBefore, popup: step.popup.before, value: before }),
        after: moment({ focus: step.focusAfter, popup: step.popup.after, value: after }),
        speech: step.speech,
        written: step.announcements.map(({ text }) => text),
        inserted: (step.insertedRegions ?? []).map(({ text }) => text),
      },
    ];
  });
}

/** Run 1 of a scenario; runs are consistent or the verdict says so. */
export function comboboxScenario(measurement: Measurement, scenarioId: string): ComboboxStep[] {
  const run = measurement.scenarios.find(({ id }) => id === scenarioId)?.runs[0];
  return run?.status === 'completed' ? comboboxSteps(run.steps) : [];
}

function focusWords(focus: ComboboxFocus): string {
  switch (focus.kind) {
    case 'combobox':
      return 'Focus in the combobox';
    case 'option':
      return `Focus on option ${focus.index}, “${focus.name}”`;
    case 'outside':
      // Where it went is the point of the Tab rule, so it is named.
      return `Focus left the field: ${focus.name || focus.role || 'an unnamed control'}`;
    case 'away':
      return 'Focus left the page';
    case 'body':
      return 'Focus lost to the page';
    case 'other':
      return `Focus on ${focus.role ?? 'an element'} “${focus.name}”`;
  }
}

const quoted = (names: readonly string[]) => names.map((name) => `“${name}”`).join(', ');

/** The options, the active one with its place, and which are exposed as selected. */
function listWords({ options, hasPopup }: ComboboxMoment): string {
  if (options.length === 0) return hasPopup ? 'The list is shown with no options' : 'No list';
  const active = options.findIndex(({ isActive }) => isActive);
  const option = options[active];
  const selected = options.filter(({ isSelected }) => isSelected).map(({ name }) => name);
  return [
    `${options.length} ${options.length === 1 ? 'option' : 'options'}`,
    option ? `“${option.name}” active (${active + 1} of ${options.length})` : 'none active',
    selected.length > 0 ? `${quoted(selected)} selected` : 'none selected',
  ].join(', ');
}

/** What a step left behind, in words, for the text that stands beside every schematic. */
export function describeComboboxStep({ after }: ComboboxStep): string {
  const nowhere = after.pointsNowhere
    ? '. The combobox points at an element that is not there'
    : '';
  return `${listWords(after)}. ${focusWords(after.focus)}${nowhere}`;
}

const activeOf = ({ options }: ComboboxMoment) => options.findIndex(({ isActive }) => isActive);
const selectedOf = ({ options }: ComboboxMoment) =>
  options.filter(({ isSelected }) => isSelected).map(({ name }) => name);

/** The list opening, closing or changing length; nothing when it stayed as it was. */
function listChange(before: ComboboxMoment, after: ComboboxMoment): string[] {
  const [was, now] = [before.options.length, after.options.length];
  if (was === now) return [];
  if (now === 0)
    return [after.hasPopup ? 'The list is shown with no options.' : 'The list closes.'];
  const count = `${now} ${now === 1 ? 'option' : 'options'}`;
  return [was === 0 ? `The list opens with ${count}.` : `The list now has ${count}.`];
}

/** The active option after the step, with whether it is the selected one too. */
function activeChange(before: ComboboxMoment, after: ComboboxMoment): string[] {
  const index = activeOf(after);
  const option = after.options[index];
  if (!option) return activeOf(before) === -1 ? [] : ['No option is active.'];
  const place = `“${option.name}” active, ${index + 1} of ${after.options.length}`;
  const others = selectedOf(after).filter((name) => name !== option.name);
  const stays = others.length > 0 ? ` ${quoted(others)} stays selected.` : '';
  return [`${place}${option.isSelected ? ', and selected' : ''}.${stays}`];
}

function fieldChange(before: ComboboxMoment, after: ComboboxMoment): string[] {
  if (after.value === undefined || after.value === before.value) return [];
  return [after.value === '' ? 'The field is empty.' : `“${after.value}” in the field.`];
}

function focusChange(before: ComboboxMoment, after: ComboboxMoment): string[] {
  if (JSON.stringify(before.focus) === JSON.stringify(after.focus)) return [];
  return [`${focusWords(after.focus)}.`];
}

/**
 * What a step changed, in words: shown beside the schematic, where repeating the whole state at
 * every step buries the one thing that moved. The whole state stays available to assistive
 * technology through describeComboboxStep.
 */
export function describeComboboxChange({ before, after }: ComboboxStep): string {
  const changes = [
    ...listChange(before, after),
    ...(after.options.length > 0 ? activeChange(before, after) : []),
    ...fieldChange(before, after),
    ...focusChange(before, after),
    ...(after.pointsNowhere ? ['The combobox points at an element that is not there.'] : []),
  ];
  return changes.length > 0 ? changes.join(' ') : 'Nothing changes.';
}

/**
 * The places focus goes to in a recording besides the combobox and its options, by the names
 * the recording gives them: a control of the combobox itself (the button that opens the list),
 * and the next control on the page. A replay keeps room for them from its first frame.
 */
export interface ComboboxPlaces {
  inside: string | undefined;
  outside: string | undefined;
}

export function comboboxPlaces(steps: readonly ComboboxStep[]): ComboboxPlaces {
  const reached = steps.flatMap(({ before, after }) => [before.focus, after.focus]);
  const nameOf = (kind: 'other' | 'outside') =>
    reached.flatMap((focus) => (focus.kind === kind ? [focus.name || focus.role || ''] : []))[0];
  return { inside: nameOf('other'), outside: nameOf('outside') };
}
