/**
 * The select tour: each rule completes only when the person performs it with real keys in the
 * playground. Pure, so the judging is tested without a browser.
 */
import type { KeyObservation, TourProgress, TourStep } from './tour';

/** What the playground's select looked like just before or after a key press. */
export interface SelectSnapshot {
  focusOnSelect: boolean;
  isOpen: boolean;
  /** The text of the option aria-activedescendant points at; null when none is active. */
  active: string | null;
  /** The chosen option's text, which the select shows. */
  value: string;
}

export interface SelectTourState extends TourProgress {
  /** Down Arrow moved the active option in the open list; Up Arrow moving it back completes. */
  hasMovedDown: boolean;
}

type Observation = KeyObservation<SelectSnapshot>;

export const initialSelectTour: SelectTourState = { done: [], hasMovedDown: false };

/** What to try in the playground, one step per rule it shows. */
export const selectTourSteps: readonly TourStep[] = [
  { id: 'down', keys: ['ArrowDown'], task: 'On the closed select, press Down Arrow' },
  {
    id: 'arrows',
    keys: ['ArrowDown', 'ArrowUp'],
    task: 'With the list open, move down an option, then back up',
  },
  { id: 'enter', keys: ['Enter'], task: 'Press Enter to choose the active option' },
  { id: 'escape', keys: ['Escape'], task: 'Open the list, move, then press Escape' },
];

const complete = (state: SelectTourState, id: string): SelectTourState =>
  state.done.includes(id) ? state : { ...state, done: [...state.done, id] };

/** The active option changed to another one while DOM focus stayed on the select. */
const movedInList = ({ before, after }: Observation) =>
  before.isOpen && after.active !== null && after.active !== before.active && after.focusOnSelect;

function observeDown(state: SelectTourState, observation: Observation): SelectTourState {
  const { before, after } = observation;
  if (!before.isOpen)
    return after.isOpen && after.active !== null ? complete(state, 'down') : state;
  return movedInList(observation) ? { ...state, hasMovedDown: true } : state;
}

const chose = ({ before, after }: Observation) =>
  before.active !== null && !after.isOpen && after.value === before.active;

const closedKeepingValue = ({ before, after }: Observation) =>
  before.isOpen && !after.isOpen && after.value === before.value;

type Judge = (state: SelectTourState, observation: Observation) => SelectTourState;

/** One judge per key the tour cares about; other keys leave the tour as it is. */
const judges: Readonly<Record<string, Judge>> = {
  ArrowDown: observeDown,
  ArrowUp: (state, observation) =>
    state.hasMovedDown && movedInList(observation) ? complete(state, 'arrows') : state,
  Enter: (state, observation) => (chose(observation) ? complete(state, 'enter') : state),
  Escape: (state, observation) =>
    closedKeepingValue(observation) ? complete(state, 'escape') : state,
};

export function observeSelectKey(
  state: SelectTourState,
  observation: Observation,
): SelectTourState {
  if (!observation.before.focusOnSelect) return state;
  const judge = judges[observation.key];
  return judge ? judge(state, observation) : state;
}

/** The reference select announces nothing: every line comes from focus and the active option. */
export const heardNothingInSelect = (state: SelectTourState): SelectTourState => state;

/** Rules a key exercises, given the select it was pressed on. */
export function selectRulesLitBy(key: string, select: SelectSnapshot): readonly string[] {
  if (!select.focusOnSelect) return [];
  if (!select.isOpen) return key === 'ArrowDown' ? ['down'] : [];
  if (key === 'ArrowDown' || key === 'ArrowUp') return ['arrows', 'selected'];
  if (key === 'Enter') return ['enter'];
  if (key === 'Escape') return ['escape', 'escape-keeps-value'];
  return [];
}
