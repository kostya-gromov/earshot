import { describe, expect, it } from 'vitest';
import { evaluatePanelReachable } from '../../../src/evaluators/tabs/panel-reachable.ts';
import { evaluateTabIn } from '../../../src/evaluators/tabs/tab-in.ts';
import { evaluateTabOut } from '../../../src/evaluators/tabs/tab-out.ts';
import {
  fieldAfter,
  fieldBefore,
  inPanel,
  off,
  onTab,
  tabSet,
  walk,
  withTabs,
} from './fixtures.ts';

describe('tab-in', () => {
  it('follows when Tab lands on the active tab, not the first one', () => {
    const input = walk('tab-in', fieldBefore('Members'), [['Tab', onTab('Members')]]);
    expect(evaluateTabIn(input)).toMatchObject({
      verdict: 'follows',
      reason: 'Tab put focus on "Members", the active tab.',
    });
  });

  it('differs when Tab lands on the first tab, even if that tab then becomes active', () => {
    const input = walk('tab-in', fieldBefore('Members'), [['Tab', onTab('Overview')]]);
    expect(evaluateTabIn(input)).toMatchObject({
      verdict: 'differs',
      reason: 'Tab put focus on "Overview" while "Members" was the active tab.',
    });
  });

  it('differs when Tab skips the tab list', () => {
    const input = walk('tab-in', fieldBefore('Members'), [['Tab', inPanel('Members')]]);
    expect(evaluateTabIn(input)).toMatchObject({
      verdict: 'differs',
      summary: 'Tab skips the tab list',
    });
  });

  it('judges the first Shift+Tab that reaches a tab, after the panel and its link', () => {
    const input = walk('tab-in-back', fieldAfter('Members'), [
      ['Shift+Tab', inPanel('Members', 'link')],
      ['Shift+Tab', inPanel('Members')],
      ['Shift+Tab', onTab('Members')],
      ['Shift+Tab', fieldBefore('Members')],
    ]);
    expect(evaluateTabIn(input).verdict).toBe('follows');
  });

  it('is not judged where no single tab was active before the key', () => {
    const start = {
      ...fieldBefore('Members'),
      tabSet: withTabs(tabSet('Members'), { selected: [] }),
    };
    const input = walk('tab-in', start, [['Tab', onTab('Members')]]);
    expect(evaluateTabIn(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'No single active tab',
    });
  });

  it('is not judged when Shift+Tab never reaches a tab', () => {
    const input = walk('tab-in-back', fieldAfter('Members'), [
      ['Shift+Tab', inPanel('Members', 'link')],
    ]);
    expect(evaluateTabIn(input).verdict).toBe('inconclusive');
  });
});

describe('tab-out', () => {
  it('follows when Tab leaves the tab list', () => {
    const input = walk('tab-out-text', onTab('Overview'), [['Tab', inPanel('Overview')]]);
    expect(evaluateTabOut(input)).toMatchObject({
      verdict: 'follows',
      reason: 'Tab moved focus from "Overview" out of the tab list, to tabpanel "Overview".',
    });
  });

  it('differs when Tab moves to the next tab', () => {
    const input = walk('tab-out-text', onTab('Overview'), [['Tab', onTab('Activity', 'Overview')]]);
    expect(evaluateTabOut(input)).toMatchObject({
      verdict: 'differs',
      summary: 'Tab moves to another tab',
    });
  });

  it('differs when focus falls to the document', () => {
    const input = walk('tab-out-link', onTab('Members'), [['Tab', off('document', 'Members')]]);
    expect(evaluateTabOut(input).summary).toBe('Focus falls to the document');
  });

  it('is not judged when focus was not on a tab', () => {
    const input = walk('tab-out-text', fieldBefore('Overview'), [['Tab', onTab('Overview')]]);
    expect(evaluateTabOut(input).verdict).toBe('inconclusive');
  });
});

describe('panel-reachable', () => {
  it('follows when Tab lands on a panel of plain text', () => {
    const input = walk('tab-out-text', onTab('Overview'), [['Tab', inPanel('Overview')]]);
    expect(evaluatePanelReachable(input).verdict).toBe('follows');
  });

  it('follows when Tab lands on the link the panel starts with', () => {
    const input = walk('tab-out-link', onTab('Members'), [['Tab', inPanel('Members', 'link')]]);
    expect(evaluatePanelReachable(input)).toMatchObject({
      verdict: 'follows',
      reason: 'Tab moved focus into the shown panel, to link "Invite people".',
    });
  });

  it('differs when Tab skips the panel', () => {
    const input = walk('tab-out-text', onTab('Overview'), [['Tab', fieldAfter('Overview')]]);
    expect(evaluatePanelReachable(input)).toMatchObject({
      verdict: 'differs',
      reason: 'Tab moved focus past the shown panel, to textbox "Notes".',
    });
  });

  it('is not judged while focus stays in the tab list: that is tab-out’s', () => {
    const input = walk('tab-out-text', onTab('Overview'), [['Tab', onTab('Activity', 'Overview')]]);
    expect(evaluatePanelReachable(input).verdict).toBe('inconclusive');
  });
});

describe('panel-reachable, when focus falls to the document', () => {
  it('is not judged: tab-out is charged with it', () => {
    const input = walk('tab-out-text', onTab('Overview'), [['Tab', off('document', 'Overview')]]);
    expect(evaluatePanelReachable(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Focus fell to the document',
    });
  });
});
