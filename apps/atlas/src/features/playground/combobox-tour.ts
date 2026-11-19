/**
 * The combobox tour: each rule completes only when the person performs it with real keys in the
 * playground. Pure, so the judging is tested without a browser.
 */
import type { KeyObservation, TourProgress, TourStep } from './tour';

/** What the playground's combobox looked like just before or after a key press. */
export interface ComboboxSnapshot {
  focusOnInput: boolean;
  isOpen: boolean;
  /** The text of the option aria-activedescendant points at; null when none is active. */
  active: string | null;
  value: string;
}

export interface ComboboxTourState extends TourProgress {
  /** Down Arrow moved the active option in an open list; Up Arrow moving it back completes. */
  hasMovedDown: boolean;
}

type Observation = KeyObservation<ComboboxSnapshot>;

export const initialComboboxTour: ComboboxTourState = { done: [], hasMovedDown: false };

/** What to try in the playground, one step per rule it shows. */
export const comboboxTourSteps: readonly TourStep[] = [
  { id: 'down', keys: ['ArrowDown'], task: 'In the closed field, press Down Arrow' },
  {
    id: 'arrows',
    keys: ['ArrowDown', 'ArrowUp'],
    task: 'With the list open, move down an option, then back up',
  },
  { id: 'enter', keys: ['Enter'], task: 'Press Enter on an option' },
  { id: 'say-results', keys: [], task: 'Type a letter and listen' },
];

const complete = (state: ComboboxTourState, id: string): ComboboxTourState =>
  state.done.includes(id) ? state : { ...state, done: [...state.done, id] };

/** The active option changed to another one while DOM focus stayed in the input. */
const movedInList = ({ before, after }: Observation) =>
  before.isOpen && after.active !== null && after.active !== before.active && after.focusOnInput;

function observeDown(state: ComboboxTourState, observation: Observation): ComboboxTourState {
  const { before, after } = observation;
  if (before.focusOnInput && !before.isOpen) {
    return after.isOpen && after.active !== null ? complete(state, 'down') : state;
  }
  // Only a move from one option to the next counts: the first press after typing enters the list.
  return before.active !== null && movedInList(observation)
    ? { ...state, hasMovedDown: true }
    : state;
}

function observeEnter(state: ComboboxTourState, { before, after }: Observation) {
  const accepted = before.active !== null && !after.isOpen && after.value === before.active;
  return accepted ? complete(state, 'enter') : state;
}

type Judge = (state: ComboboxTourState, observation: Observation) => ComboboxTourState;

/** One judge per key the tour cares about; other keys leave the tour as it is. */
const judges: Readonly<Record<string, Judge>> = {
  ArrowDown: observeDown,
  ArrowUp: (state, observation) =>
    state.hasMovedDown && movedInList(observation) ? complete(state, 'arrows') : state,
  Enter: observeEnter,
};

export function observeComboboxKey(
  state: ComboboxTourState,
  observation: Observation,
): ComboboxTourState {
  const judge = judges[observation.key];
  return judge ? judge(state, observation) : state;
}

/** "Say that the suggestions changed" completes on the reference's own message after typing. */
export const heardSuggestions = (state: ComboboxTourState, text: string): ComboboxTourState =>
  /suggestions?$/.test(text) ? complete(state, 'say-results') : state;

/**
 * Rules a key exercises. Down Arrow is two rules: it opens a closed list on an option, and it
 * moves through an open one. "Say" lights on announcements instead.
 */
export function comboboxRulesLitBy(key: string, field: ComboboxSnapshot): readonly string[] {
  if (!field.focusOnInput) return [];
  if (key === 'ArrowDown') return [field.isOpen ? 'arrows' : 'down'];
  if (key === 'ArrowUp' && field.isOpen) return ['arrows'];
  if (key === 'Enter' && field.active !== null) return ['enter'];
  return [];
}
