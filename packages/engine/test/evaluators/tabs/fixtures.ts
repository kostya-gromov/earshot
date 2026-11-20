import type { AccessibleNode, FocusInfo, Step, TabSetState } from '@earshot/contracts';
import type { EvaluatorInput } from '../../../src/model/evaluator.ts';

export const names = ['Overview', 'Activity', 'Members', 'Settings'];

/** A moment as the engine records it: focus and the tab set. */
export interface Moment {
  focus: FocusInfo;
  tabSet: TabSetState;
}

const tab = (name: string, selected: boolean | undefined): AccessibleNode => ({
  role: 'tab',
  name,
  states: selected === undefined ? {} : { selected },
});

const panel = (name: string): AccessibleNode => ({ role: 'tabpanel', name, states: {} });

/** The tab set with `active` selected and its panel shown, as the reference renders it. */
export const tabSet = (active: string): TabSetState => ({
  tabs: names.map((name) => tab(name, name === active)),
  panels: [panel(active)],
});

/** Override parts of a tab set: its selected states, or the panels it shows. */
export const withTabs = (
  base: TabSetState,
  parts: { selected?: readonly (boolean | undefined)[]; panels?: readonly string[] },
): TabSetState => ({
  tabs: parts.selected ? names.map((name, i) => tab(name, parts.selected![i])) : base.tabs,
  panels: parts.panels ? parts.panels.map(panel) : base.panels,
});

/** The same element keeps its number, as the engine gives it: derived from the key, no state. */
const element = (key: string): number =>
  [...key].reduce((number, char) => (number * 31 + char.charCodeAt(0)) % 65_521, 7) + 1;

/** DOM focus on the tab named `focused`, with `active` the selected one (default: the same tab). */
export const onTab = (focused: string, active = focused): Moment => ({
  focus: {
    role: 'tab',
    name: focused,
    states: { selected: focused === active },
    isBody: false,
    isInsideComponent: true,
    isInsidePanel: false,
    item: { index: names.indexOf(focused) + 1, count: names.length },
    element: element(`tab:${focused}`),
  },
  tabSet: tabSet(active),
});

/** Focus outside the tab list: on a field, the panel, or the document. */
export const off = (
  where: { role: string; name: string; inPanel?: boolean } | 'document',
  active: string,
): Moment => ({
  focus:
    where === 'document'
      ? { role: null, name: '', states: {}, isBody: true, isInsideComponent: false }
      : {
          role: where.role,
          name: where.name,
          states: {},
          isBody: false,
          isInsideComponent: true,
          isInsidePanel: where.inPanel === true,
          element: element(`${where.role}:${where.name}`),
        },
  tabSet: tabSet(active),
});

export const fieldBefore = (active: string) =>
  off({ role: 'textbox', name: 'Project name' }, active);
export const fieldAfter = (active: string) => off({ role: 'textbox', name: 'Notes' }, active);
export const inPanel = (active: string, role = 'tabpanel') =>
  off({ role, name: role === 'tabpanel' ? active : 'Invite people', inPanel: true }, active);

/** A scenario from a start and the keys pressed with the moment each led to. */
export function walk(
  scenarioId: string,
  start: Moment,
  presses: readonly (readonly [string, Moment])[],
): EvaluatorInput {
  let before = start;
  const steps: Step[] = presses.map(([key, after]) => {
    const step: Step = {
      action: { type: 'press', key },
      focusBefore: before.focus,
      focusAfter: after.focus,
      announcements: [],
      axDiff: { added: [], removed: [], changed: [] },
      settle: { ms: 20, quiet: true },
      tabSet: { before: before.tabSet, after: after.tabSet },
      speech: ['line'],
    };
    before = after;
    return step;
  });
  return { scenarioId, steps };
}
