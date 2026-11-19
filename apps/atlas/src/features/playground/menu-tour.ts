/**
 * The menu button tour: each rule completes only when the person performs it with real keys in
 * the playground. Pure, so the judging is tested without a browser.
 */
import type { KeyObservation, TourProgress, TourStep } from './tour';

/** What the playground's menu button looked like just before or after a key press. */
export interface MenuSnapshot {
  focusOnButton: boolean;
  isOpen: boolean;
  /** The name of the item that holds focus; null when none does. */
  active: string | null;
  activeIsDisabled: boolean;
  /** The line the item's own action writes: "Last action: Duplicate". */
  lastAction: string;
}

export interface MenuTourState extends TourProgress {
  /** Down Arrow moved to another item in the open menu; Up Arrow moving back completes. */
  hasMovedDown: boolean;
}

type Observation = KeyObservation<MenuSnapshot>;

export const initialMenuTour: MenuTourState = { done: [], hasMovedDown: false };

/** What to try in the playground, one step per rule it shows. */
export const menuTourSteps: readonly TourStep[] = [
  { id: 'open', keys: ['Enter'], task: 'On the button, press Enter' },
  {
    id: 'arrows',
    keys: ['ArrowDown', 'ArrowUp'],
    task: 'With the menu open, move down an item, then back up',
  },
  { id: 'activate', keys: ['Enter'], task: 'Press Enter on an item that is not disabled' },
  { id: 'escape', keys: ['Escape'], task: 'Open the menu again and press Escape' },
];

const complete = (state: MenuTourState, id: string): MenuTourState =>
  state.done.includes(id) ? state : { ...state, done: [...state.done, id] };

/** Another item holds focus than before, in a menu that was already open. */
const movedInMenu = ({ before, after }: Observation) =>
  before.isOpen &&
  before.active !== null &&
  after.active !== null &&
  after.active !== before.active;

/** Enter is two rules: on the button it opens the menu, on an item it runs the item's action. */
function observeEnter(state: MenuTourState, { before, after }: Observation): MenuTourState {
  if (before.focusOnButton && !before.isOpen) {
    return after.isOpen && after.active !== null ? complete(state, 'open') : state;
  }
  // The page's own line names the item: the action ran, the menu did not merely close.
  const ran = before.active !== null && after.lastAction === `Last action: ${before.active}`;
  return ran && !after.isOpen ? complete(state, 'activate') : state;
}

type Judge = (state: MenuTourState, observation: Observation) => MenuTourState;

/** One judge per key the tour cares about; other keys leave the tour as it is. */
const judges: Readonly<Record<string, Judge>> = {
  Enter: observeEnter,
  ArrowDown: (state, observation) =>
    movedInMenu(observation) ? { ...state, hasMovedDown: true } : state,
  ArrowUp: (state, observation) =>
    state.hasMovedDown && movedInMenu(observation) ? complete(state, 'arrows') : state,
  Escape: (state, { before, after }) =>
    before.isOpen && !after.isOpen && after.focusOnButton ? complete(state, 'escape') : state,
};

export function observeMenuKey(state: MenuTourState, observation: Observation): MenuTourState {
  const judge = judges[observation.key];
  return judge ? judge(state, observation) : state;
}

/** The reference menu button announces nothing: every line comes from focus landing. */
export const heardNothing = (state: MenuTourState): MenuTourState => state;

/** In an open menu each key has one rule; Enter has none on a disabled item, where nothing runs. */
function litInMenu(key: string, menu: MenuSnapshot): readonly string[] {
  if (key === 'ArrowDown' || key === 'ArrowUp') return ['arrows'];
  if (key === 'Escape') return ['escape'];
  const canRun = key === 'Enter' && menu.active !== null && !menu.activeIsDisabled;
  return canRun ? ['activate'] : [];
}

/** Rules a key exercises, given where focus is and whether the menu is open. */
export function menuRulesLitBy(key: string, menu: MenuSnapshot): readonly string[] {
  if (menu.isOpen) return litInMenu(key, menu);
  return menu.focusOnButton && (key === 'Enter' || key === ' ') ? ['open'] : [];
}
