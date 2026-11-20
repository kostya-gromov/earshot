import type { FocusInfo, Step, TabSetState } from '@earshot/contracts';
import { describe, expect, it } from 'vitest';
import { describeTabsChange, tabsOutside, tabsSteps } from '../../src/lib/tabs-replay';

const names = ['Overview', 'Activity', 'Members', 'Settings'];
const set = (selected: string, panels: readonly string[] = [selected]): TabSetState => ({
  tabs: names.map((name) => ({ role: 'tab', name, states: { selected: name === selected } })),
  panels: panels.map((name) => ({ role: 'tabpanel', name, states: {} })),
});
const onTab = (name: string): FocusInfo => ({
  role: 'tab',
  name,
  states: {},
  isBody: false,
  isInsideComponent: true,
  isInsidePanel: false,
  item: { index: names.indexOf(name) + 1, count: names.length },
});
const field: FocusInfo = {
  role: 'textbox',
  name: 'Notes',
  states: {},
  isBody: false,
  isInsideComponent: false,
  isInsidePanel: false,
};
const step = (parts: {
  key: string;
  from: FocusInfo;
  to: FocusInfo;
  before: TabSetState;
  after: TabSetState;
}): Step => ({
  action: { type: 'press', key: parts.key },
  focusBefore: parts.from,
  focusAfter: parts.to,
  announcements: [],
  axDiff: { added: [], removed: [], changed: [] },
  settle: { ms: 10, quiet: true },
  tabSet: { before: parts.before, after: parts.after },
  speech: ['line'],
});

describe('a tabs replay', () => {
  it('says where focus went, the new selection and the new panel', () => {
    const [moved] = tabsSteps([
      step({
        key: 'ArrowRight',
        from: onTab('Overview'),
        to: onTab('Activity'),
        before: set('Overview'),
        after: set('Activity'),
      }),
    ]);
    expect(moved && describeTabsChange(moved)).toBe(
      'Focus on the tab “Activity”. “Activity” is selected. The panel “Activity” is shown.',
    );
  });

  it('says nothing changed where nothing did, and names the control focus left for', () => {
    const steps = tabsSteps([
      step({
        key: 'ArrowDown',
        from: onTab('Overview'),
        to: onTab('Overview'),
        before: set('Overview'),
        after: set('Overview'),
      }),
      step({
        key: 'Tab',
        from: onTab('Overview'),
        to: field,
        before: set('Overview'),
        after: set('Overview'),
      }),
    ]);
    expect(steps[0] && describeTabsChange(steps[0])).toBe('Nothing changes.');
    expect(steps[1] && describeTabsChange(steps[1])).toBe('Focus left the tabs: Notes.');
    expect(tabsOutside(steps)).toBe('Notes');
  });

  it('is empty for a recording without the tab set', () => {
    const { tabSet: _, ...plain } = step({
      key: 'Tab',
      from: onTab('Overview'),
      to: field,
      before: set('Overview'),
      after: set('Overview'),
    });
    expect(tabsSteps([plain])).toEqual([]);
  });
});
