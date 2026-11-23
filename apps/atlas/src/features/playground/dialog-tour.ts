/**
 * The dialog tour: each rule completes only when the person performs it with real keys in the
 * playground. Pure, so the judging is tested without a browser.
 */
import type { KeyObservation, TourProgress, TourStep } from './tour';

/** What the playground's dialog looked like just before or after a key press. */
export interface DialogSnapshot {
  isOpen: boolean;
  /** Focus is on the button that opens the dialog. */
  onOpener: boolean;
  /**
   * The place of the focused element among the dialog's fields and buttons, from 1; null when
   * focus is not on one of them.
   */
  focused: number | null;
  /** How many fields and buttons the dialog holds. */
  count: number;
}

type Observation = KeyObservation<DialogSnapshot>;

export const initialDialogTour: TourProgress = { done: [] };

/** What to try in the playground, one step per rule it shows. */
export const dialogTourSteps: readonly TourStep[] = [
  { id: 'open-focus', keys: ['Enter'], task: 'On the button, press Enter' },
  { id: 'wrap', keys: ['Tab'], task: 'On the last button, press Tab' },
  { id: 'return-focus', keys: ['Escape'], task: 'In the dialog, press Escape' },
];

const complete = (state: TourProgress, id: string): TourProgress =>
  state.done.includes(id) ? state : { ...state, done: [...state.done, id] };

const opens = (key: string) => key === 'Enter' || key === ' ';

/** Tab from the last control to the first, or Shift+Tab from the first to the last. */
function wrapped(key: string, { before, after }: Observation): boolean {
  if (!before.isOpen || !after.isOpen) return false;
  if (key === 'Tab') return before.focused === before.count && after.focused === 1;
  return key === 'Shift+Tab' && before.focused === 1 && after.focused === after.count;
}

/** Enter or Space on the button opened the dialog, and focus is on one of its controls. */
const opened = (key: string, { before, after }: Observation): boolean =>
  opens(key) && before.onOpener && !before.isOpen && after.isOpen && after.focused !== null;

/** Escape closed the dialog, and focus is back on the button. */
const closedBack = (key: string, { before, after }: Observation): boolean =>
  key === 'Escape' && before.isOpen && !after.isOpen && after.onOpener;

export function observeDialogKey(state: TourProgress, observation: Observation): TourProgress {
  const { key } = observation;
  if (opened(key, observation)) return complete(state, 'open-focus');
  if (wrapped(key, observation)) return complete(state, 'wrap');
  if (closedBack(key, observation)) return complete(state, 'return-focus');
  return state;
}

/** The reference dialog announces nothing: every line comes from focus landing. */
export const heardNothingInDialog = (state: TourProgress): TourProgress => state;

/** Rules a key exercises, given where focus is. */
export function dialogRulesLitBy(key: string, dialog: DialogSnapshot): readonly string[] {
  if (!dialog.isOpen) return dialog.onOpener && opens(key) ? ['open-focus'] : [];
  if (key === 'Tab' || key === 'Shift+Tab') return ['contained', 'wrap'];
  if (key === 'Escape') return ['escape', 'return-focus'];
  return [];
}
