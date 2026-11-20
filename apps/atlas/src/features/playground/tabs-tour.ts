/**
 * The tabs tour: each rule completes only when the person performs it with real keys in the
 * playground. Pure, so the judging is tested without a browser.
 */
import type { KeyObservation, TourProgress, TourStep } from './tour';

/** What the playground's tabs looked like just before or after a key press. */
export interface TabsSnapshot {
  /** The tabs' names in order. */
  names: readonly string[];
  /** The tab that holds focus; null when none does. */
  focused: string | null;
  /** The tab exposed as selected; null when none is. */
  selected: string | null;
  /** Focus is on the shown panel or inside it. */
  focusInPanel: boolean;
}

type Observation = KeyObservation<TabsSnapshot>;

export const initialTabsTour: TourProgress = { done: [] };

/** What to try in the playground, one step per rule it shows. */
export const tabsTourSteps: readonly TourStep[] = [
  { id: 'arrows', keys: ['ArrowRight'], task: 'On a tab, press Right Arrow' },
  { id: 'wrap', keys: ['ArrowLeft'], task: 'On the first tab, press Left Arrow' },
  { id: 'panel-reachable', keys: ['Tab'], task: 'From a tab, press Tab' },
];

const complete = (state: TourProgress, id: string): TourProgress =>
  state.done.includes(id) ? state : { ...state, done: [...state.done, id] };

const offsets: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 };

/** The tab an arrow key should reach from `from`, wrapping at both ends. */
function expectedTab(names: readonly string[], from: string, key: string): string | undefined {
  const index = names.indexOf(from) + (offsets[key] ?? 0);
  return names[(index + names.length) % names.length];
}

const isAtEnd = (names: readonly string[], from: string, key: string): boolean => {
  const index = names.indexOf(from) + (offsets[key] ?? 0);
  return index < 0 || index >= names.length;
};

function observeArrow(state: TourProgress, { key, before, after }: Observation): TourProgress {
  if (before.focused === null || after.focused !== expectedTab(before.names, before.focused, key)) {
    return state;
  }
  return complete(state, isAtEnd(before.names, before.focused, key) ? 'wrap' : 'arrows');
}

export function observeTabsKey(state: TourProgress, observation: Observation): TourProgress {
  if (observation.key in offsets) return observeArrow(state, observation);
  const { before, after } = observation;
  if (observation.key === 'Tab' && before.focused !== null && after.focusInPanel) {
    return complete(state, 'panel-reachable');
  }
  return state;
}

/** The reference tabs announce nothing: every line comes from focus landing. */
export const heardNothingInTabs = (state: TourProgress): TourProgress => state;

/** Rules a key exercises, given where focus is among the tabs. */
export function tabsRulesLitBy(key: string, tabs: TabsSnapshot): readonly string[] {
  if (tabs.focused === null) return [];
  if (key in offsets) return isAtEnd(tabs.names, tabs.focused, key) ? ['wrap'] : ['arrows'];
  if (key === 'Tab') return ['tab-out', 'panel-reachable'];
  if (key === 'ArrowDown' || key === 'ArrowUp') return ['vertical-keys-free'];
  return [];
}
