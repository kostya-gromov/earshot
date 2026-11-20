import { describe, expect, it } from 'vitest';
import {
  initialTabsTour,
  observeTabsKey,
  tabsRulesLitBy,
  type TabsSnapshot,
} from '../../src/features/playground/tabs-tour';

const names = ['Overview', 'Activity', 'Members', 'Settings'];
const on = (focused: string): TabsSnapshot => ({
  names,
  focused,
  selected: focused,
  focusInPanel: false,
});
const inPanel: TabsSnapshot = { names, focused: null, selected: 'Overview', focusInPanel: true };
const outside: TabsSnapshot = { ...inPanel, focusInPanel: false };

const press = (keys: readonly [string, TabsSnapshot, TabsSnapshot][]) =>
  keys.reduce(
    (state, [key, before, after]) => observeTabsKey(state, { key, before, after }),
    initialTabsTour,
  );

describe('the tabs tour', () => {
  it('completes “arrows” when Right Arrow reaches the next tab', () => {
    expect(press([['ArrowRight', on('Overview'), on('Activity')]]).done).toEqual(['arrows']);
  });

  it('completes “wrap”, not “arrows”, when Left Arrow on the first tab reaches the last', () => {
    expect(press([['ArrowLeft', on('Overview'), on('Settings')]]).done).toEqual(['wrap']);
  });

  it('completes nothing when an arrow key leaves focus where it was', () => {
    expect(press([['ArrowLeft', on('Overview'), on('Overview')]]).done).toEqual([]);
  });

  it('completes “panel-reachable” when Tab from a tab lands in the panel, and only then', () => {
    expect(press([['Tab', on('Overview'), inPanel]]).done).toEqual(['panel-reachable']);
    expect(press([['Tab', on('Overview'), outside]]).done).toEqual([]);
  });

  it('lights the rule a key exercises from a tab, and none away from the tabs', () => {
    expect(tabsRulesLitBy('ArrowRight', on('Settings'))).toEqual(['wrap']);
    expect(tabsRulesLitBy('ArrowRight', on('Overview'))).toEqual(['arrows']);
    expect(tabsRulesLitBy('ArrowDown', on('Overview'))).toEqual(['vertical-keys-free']);
    expect(tabsRulesLitBy('Tab', on('Overview'))).toEqual(['tab-out', 'panel-reachable']);
    expect(tabsRulesLitBy('ArrowRight', inPanel)).toEqual([]);
  });
});
