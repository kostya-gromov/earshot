import type { ScenarioDefinition } from './types.ts';

/** The four tabs of every measured page, in order (docs/proposals/tabs.md, Scenarios). */
export const tabNames = ['Overview', 'Activity', 'Members', 'Settings'] as const;
export type TabName = (typeof tabNames)[number];

export interface TabsState {
  /**
   * The tab that is active when the steps begin. Overview is active when the page loads; Members,
   * whose panel starts with a link, is reached by clicking it, the way a person would.
   */
  active: Extract<TabName, 'Overview' | 'Members'>;
  /** Where focus is when the steps begin. */
  start: 'active-tab' | 'field-before' | 'field-after';
}

/** No scenario step clicks anything; the starting click on Members belongs to setup. */
export type TabsInteraction = never;

type Scenario = ScenarioDefinition<TabsState, TabsInteraction>;
type Steps = Scenario['steps'];

const press = (...keys: string[]): Steps => keys.map((key) => ({ type: 'press', key }));

const where: Record<TabsState['start'], string> = {
  'active-tab': 'focus on the active tab',
  'field-before': 'focus in the field before the tabs',
  'field-after': 'focus in the field after the tabs',
};

const scenario = (
  id: string,
  rules: readonly string[],
  { state, steps }: { state: TabsState; steps: Steps },
): Scenario => ({
  id,
  // `selected` and `panel` are judged after every step of every scenario (tabs-rules.ts).
  rules: [...rules, 'selected', 'panel'],
  requestedStateDescription: `${state.active} active, ${where[state.start]}`,
  initialState: state,
  steps,
});

const onOverview: TabsState = { active: 'Overview', start: 'active-tab' };
const onMembers: TabsState = { active: 'Members', start: 'active-tab' };

export const tabsScenarios: readonly Scenario[] = [
  // Members, not the first tab, is active, so landing on the first tab is told apart.
  scenario('tab-in', ['tab-in'], {
    state: { active: 'Members', start: 'field-before' },
    steps: press('Tab'),
  }),
  // Back from the field after: through Members' link and its panel, if they are stops, to the
  // tab list. Four presses reach it in any of those cases; the first that lands on a tab is judged.
  scenario('tab-in-back', ['tab-in'], {
    state: { active: 'Members', start: 'field-after' },
    steps: press('Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab'),
  }),
  // Overview's panel holds plain text only: Tab should land on the panel itself.
  scenario('tab-out-text', ['tab-out', 'panel-reachable'], {
    state: onOverview,
    steps: press('Tab'),
  }),
  // Members' panel starts with a link: Tab may land on the panel or on the link.
  scenario('tab-out-link', ['tab-out', 'panel-reachable'], {
    state: onMembers,
    steps: press('Tab'),
  }),
  scenario('move', ['arrows'], {
    state: onOverview,
    steps: press('ArrowRight', 'ArrowRight', 'ArrowLeft'),
  }),
  // Left from the first tab, then Right from wherever that landed: both ends when it wrapped.
  scenario('ends', ['wrap'], { state: onOverview, steps: press('ArrowLeft', 'ArrowRight') }),
  scenario('activate-enter', ['activate'], {
    state: onOverview,
    steps: press('ArrowRight', 'Enter'),
  }),
  scenario('activate-space', ['activate'], {
    state: onOverview,
    steps: press('ArrowRight', 'Space'),
  }),
  scenario('vertical-keys', ['vertical-keys-free'], {
    state: onOverview,
    steps: press('ArrowDown', 'ArrowUp'),
  }),
  // Recorded only: Home and End are optional in APG.
  scenario('home-end', [], { state: onOverview, steps: press('End', 'Home') }),
];
