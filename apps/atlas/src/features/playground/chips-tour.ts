/**
 * The input-with-chips tour: each rule completes only when the person performs it with real keys
 * in the playground. Pure, so the judging is tested without a browser. Each pattern judges its
 * own tour; only the contract the rule set needs is shared (tour.ts).
 */
import type { KeyObservation as Observed } from './tour';

export type TourRuleId = 'tab' | 'bsp' | 'arrows' | 'say';

/** What the playground looked like just before or after a key press. */
export interface FieldSnapshot {
  focusInField: boolean;
  focusOnInput: boolean;
  focusOnChip: boolean;
  inputEmpty: boolean;
  chipCount: number;
}

export type KeyObservation = Observed<FieldSnapshot>;

export interface TourState {
  done: readonly TourRuleId[];
  /** Backspace in the empty input moved focus to a chip; the next Backspace completes the rule. */
  isChipFocusedByBackspace: boolean;
  /** Left Arrow reached a chip; Right Arrow back to the input completes the rule. */
  hasEnteredChips: boolean;
}

export const initialTour: TourState = {
  done: [],
  isChipFocusedByBackspace: false,
  hasEnteredChips: false,
};

const complete = (state: TourState, id: TourRuleId): TourState =>
  state.done.includes(id) ? state : { ...state, done: [...state.done, id] };

function observeBackspace(state: TourState, { before, after }: KeyObservation): TourState {
  if (before.focusOnInput && before.inputEmpty && after.focusOnChip) {
    return { ...state, isChipFocusedByBackspace: true };
  }
  const removed = after.chipCount < before.chipCount;
  if (before.focusOnChip && state.isChipFocusedByBackspace && removed)
    return complete(state, 'bsp');
  return state;
}

type Judge = (state: TourState, observation: KeyObservation) => TourState;

/** One judge per key the tour cares about; other keys leave the tour as it is. */
const judges: Readonly<Record<string, Judge>> = {
  Backspace: observeBackspace,
  ArrowLeft: (state, { after }) =>
    after.focusOnChip ? { ...state, hasEnteredChips: true } : state,
  ArrowRight: (state, { before, after }) =>
    before.focusOnChip && state.hasEnteredChips && after.focusOnInput
      ? complete(state, 'arrows')
      : state,
  Tab: (state, { before, after }) =>
    before.focusInField && !after.focusInField ? complete(state, 'tab') : state,
};

export function observeKey(state: TourState, observation: KeyObservation): TourState {
  const judge = judges[observation.key];
  return judge ? judge(state, observation) : state;
}

/** "Announce the change" completes when adding a person is announced (the reference's wording). */
export const heardMessage = (state: TourState, text: string): TourState =>
  / added\. \d+ selected$/.test(text) ? complete(state, 'say') : state;

const keyRules: Readonly<Record<string, TourRuleId>> = {
  Tab: 'tab',
  'Shift+Tab': 'tab',
  Backspace: 'bsp',
  ArrowLeft: 'arrows',
  ArrowRight: 'arrows',
};

/** Rules a key exercises. "Say" is about what is heard, so it lights on announcements instead. */
export function rulesLitBy(key: string): TourRuleId[] {
  const rule = keyRules[key];
  return rule ? [rule] : [];
}
