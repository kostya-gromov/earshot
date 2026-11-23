import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Measurement, type FocusInfo, type Step, type TabSetState } from '@earshot/contracts';
import { describe, expect, it } from 'vitest';
import {
  describeTabsChange,
  tabsAwaySide,
  tabsLeavePage,
  tabsOutsideAt,
  tabsOutsideNames,
  tabsSteps,
} from '../../src/lib/tabs-replay';

const measured = path.join(import.meta.dirname, '../../../../data/measurements/tabs');

// The invariant, from the files: wherever a recording has focus on a control outside the tabs,
// the box the schematic draws outside carries that control's recorded name at that step.
describe('the control outside in the drawing is the one in the recording', () => {
  for (const file of readdirSync(measured).filter((name) => name.endsWith('.json'))) {
    it(`${file}: every step of every scenario`, () => {
      const measurement = Measurement.parse(
        JSON.parse(readFileSync(path.join(measured, file), 'utf8')),
      );
      let checked = 0;
      for (const scenario of measurement.scenarios) {
        const run = scenario.runs[0];
        if (run?.status !== 'completed') continue;
        const steps = tabsSteps(run.steps);
        run.steps.forEach(({ focusAfter }, index) => {
          if (steps[index]?.after.focus.kind !== 'outside') return;
          checked += 1;
          expect(tabsOutsideAt(steps, index), `${scenario.id}, step ${index + 1}`).toBe(
            focusAfter.name,
          );
        });
      }
      expect(checked).toBeGreaterThan(0);
    });
  }
});

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
    // Before focus goes there, the box already holds the control it will go to.
    expect(tabsOutsideAt(steps, -1)).toBe('Notes');
    expect(tabsOutsideAt(steps, 1)).toBe('Notes');
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

  // Shift+Tab past the first field of the page: the document has no focus, the browser has it.
  it('says focus left the page, not that it was lost, when the document no longer has focus', () => {
    const away: FocusInfo = {
      role: null,
      name: '',
      states: {},
      isBody: true,
      leftPage: true,
      isInsideComponent: false,
      isInsidePanel: false,
    };
    const [left] = tabsSteps([
      step({
        key: 'Shift+Tab',
        from: field,
        to: away,
        before: set('Overview'),
        after: set('Overview'),
      }),
    ]);
    expect(left!.after.focus).toEqual({ kind: 'away' });
    expect(describeTabsChange(left!)).toBe('Focus left the page.');
    expect(tabsLeavePage([left!])).toBe(true);
  });

  // "Shift+Tab back into the tabs": from the field after, through the tabs, past the field before.
  it('names the control outside by the one focus is on, and says which way focus left the page', () => {
    const before: FocusInfo = { ...field, name: 'Project name' };
    const away: FocusInfo = {
      role: null,
      name: '',
      states: {},
      isBody: true,
      leftPage: true,
      isInsideComponent: false,
      isInsidePanel: false,
    };
    const places = [field, onTab('Members'), before, away];
    const steps = tabsSteps(
      places.slice(1).map((to, index) =>
        step({
          key: 'Shift+Tab',
          from: places[index]!,
          to,
          before: set('Members'),
          after: set('Members'),
        }),
      ),
    );
    // Before the first key and on the tab: the control focus was last on. Then the other one.
    expect([-1, 0, 1, 2].map((index) => tabsOutsideAt(steps, index))).toEqual([
      'Notes',
      'Notes',
      'Project name',
      'Project name',
    ]);
    expect(tabsOutsideNames(steps)).toEqual(['Notes', 'Project name']);
    expect(tabsAwaySide(steps)).toBe('before');
  });
});
