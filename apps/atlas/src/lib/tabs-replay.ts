import type { FocusInfo, Step, TabSetState } from '@earshot/contracts';

/**
 * A tabs recording in the terms a replay draws: the tabs with the selected one and the one that
 * has focus, the panel that is shown, and where focus is when it is not on a tab. Every field is
 * what the engine recorded (engine 0.17.0, `Step.tabSet`).
 */
export type TabsFocus =
  | { kind: 'tab'; name: string }
  | { kind: 'panel' }
  | { kind: 'in-panel'; role: string | null; name: string }
  | { kind: 'outside'; role: string | null; name: string }
  | { kind: 'body' };

export interface TabsTab {
  name: string;
  /** Undefined where the tree gives the tab no selected state. */
  isSelected: boolean | undefined;
  hasFocus: boolean;
}

export interface TabsMoment {
  focus: TabsFocus;
  tabs: readonly TabsTab[];
  /** The names of the panels in the accessibility tree; one, where the page does as asked. */
  panels: readonly string[];
}

export interface TabsStep {
  key: string;
  before: TabsMoment;
  after: TabsMoment;
}

/** The tab focus is on: by aria-activedescendant, or by its place among the tabs, or its name. */
function focusedTab(focus: FocusInfo, tabSet: TabSetState): string | undefined {
  const names = tabSet.tabs.map(({ name }) => name);
  const named = focus.activeDescendant?.name;
  if (named !== undefined && names.includes(named)) return named;
  if (!focus.item) return undefined;
  if (focus.item.count === names.length) return names[focus.item.index - 1];
  return focus.role === 'tab' && names.includes(focus.name) ? focus.name : undefined;
}

function tabsFocus(focus: FocusInfo, tabSet: TabSetState): TabsFocus {
  if (focus.isBody) return { kind: 'body' };
  const tab = focusedTab(focus, tabSet);
  if (tab !== undefined) return { kind: 'tab', name: tab };
  if (focus.isInsidePanel && focus.role === 'tabpanel') return { kind: 'panel' };
  if (focus.isInsidePanel) return { kind: 'in-panel', role: focus.role, name: focus.name };
  return { kind: 'outside', role: focus.role, name: focus.name };
}

function moment(focus: FocusInfo, tabSet: TabSetState): TabsMoment {
  const focused = focusedTab(focus, tabSet);
  return {
    focus: tabsFocus(focus, tabSet),
    tabs: tabSet.tabs.map(({ name, states }) => ({
      name,
      isSelected: states.selected,
      hasFocus: name === focused,
    })),
    panels: tabSet.panels.map(({ name }) => name),
  };
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

/** One run's steps as a tabs replay; empty unless every step recorded the tab set. */
export function tabsSteps(steps: readonly Step[]): TabsStep[] {
  if (!steps.every(({ tabSet }) => tabSet)) return [];
  return steps.flatMap((step) =>
    step.tabSet
      ? [
          {
            key: keyOf(step),
            before: moment(step.focusBefore, step.tabSet.before),
            after: moment(step.focusAfter, step.tabSet.after),
          },
        ]
      : [],
  );
}

const selectedOf = ({ tabs }: TabsMoment) =>
  tabs.filter(({ isSelected }) => isSelected === true).map(({ name }) => name);

function focusWords(focus: TabsFocus): string {
  switch (focus.kind) {
    case 'tab':
      return `Focus on the tab “${focus.name}”.`;
    case 'panel':
      return 'Focus on the shown panel.';
    case 'in-panel':
      return `Focus inside the shown panel: ${focus.role ?? 'an element'} “${focus.name}”.`;
    case 'outside':
      // Past the panel is the point of "Tab reaches the shown panel", so it is named.
      return `Focus left the tabs: ${focus.name || focus.role || 'an unnamed control'}.`;
    case 'body':
      return 'Focus lost to the page.';
  }
}

function selectionChange(before: TabsMoment, after: TabsMoment): string[] {
  const [was, now] = [selectedOf(before), selectedOf(after)];
  if (was.join() === now.join()) return [];
  if (now.length === 1) return [`“${now[0]}” is selected.`];
  return now.length === 0 ? ['No tab is selected.'] : [`${now.length} tabs are selected.`];
}

function panelChange(before: TabsMoment, after: TabsMoment): string[] {
  if (before.panels.join() === after.panels.join()) return [];
  if (after.panels.length === 0) return ['No panel is shown.'];
  if (after.panels.length > 1) return [`${after.panels.length} panels are shown.`];
  return [`The panel “${after.panels[0]}” is shown.`];
}

/**
 * What a step changed, in words, beside the schematic. A step that changed nothing says so: for
 * Down Arrow in a horizontal tab list, that is what was asked for.
 */
export function describeTabsChange({ before, after }: TabsStep): string {
  const moved = JSON.stringify(before.focus) !== JSON.stringify(after.focus);
  const changes = [
    ...(moved ? [focusWords(after.focus)] : []),
    ...selectionChange(before, after),
    ...panelChange(before, after),
  ];
  return changes.length > 0 ? changes.join(' ') : 'Nothing changes.';
}

/** The control focus goes to outside the tabs and their panel in a recording, by the name recorded. */
export function tabsOutside(steps: readonly TabsStep[]): string | undefined {
  const reached = steps.flatMap(({ before, after }) => [before.focus, after.focus]);
  return reached.flatMap((focus) =>
    focus.kind === 'outside' ? [focus.name || focus.role || ''] : [],
  )[0];
}
