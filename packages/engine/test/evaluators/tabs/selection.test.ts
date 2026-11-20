import { describe, expect, it } from 'vitest';
import { evaluateActivate } from '../../../src/evaluators/tabs/activate.ts';
import { evaluatePanel } from '../../../src/evaluators/tabs/panel.ts';
import { evaluateSelected } from '../../../src/evaluators/tabs/selected.ts';
import { onTab, tabSet, walk, withTabs, type Moment } from './fixtures.ts';

const set = (moment: Moment, parts: Parameters<typeof withTabs>[1]): Moment => ({
  ...moment,
  tabSet: withTabs(moment.tabSet, parts),
});

describe('activate', () => {
  const manual = (key: string, after: Moment) =>
    walk(`activate-${key.toLowerCase()}`, onTab('Overview'), [
      ['ArrowRight', onTab('Activity', 'Overview')],
      [key, after],
    ]);

  it('follows when Enter makes the focused tab active and shows its panel', () => {
    expect(evaluateActivate(manual('Enter', onTab('Activity')))).toMatchObject({
      verdict: 'follows',
      reason: 'Enter on "Activity" made it the active tab and showed its panel.',
    });
  });

  it('follows when only the panel moved: the mismatch is panel’s, not activate’s', () => {
    const panelOnly = set(onTab('Activity', 'Overview'), { panels: ['Activity'] });
    expect(evaluateActivate(manual('Space', panelOnly)).reason).toBe(
      'Space on "Activity" showed its panel.',
    );
  });

  it('differs when Space changes nothing', () => {
    expect(evaluateActivate(manual('Space', onTab('Activity', 'Overview')))).toMatchObject({
      verdict: 'differs',
      reason:
        'Space on "Activity" left "Overview" active and did not show the panel of "Activity".',
    });
  });

  it('is not applicable where the arrow key already activated the tab', () => {
    const input = walk('activate-enter', onTab('Overview'), [
      ['ArrowRight', onTab('Activity')],
      ['Enter', onTab('Activity')],
    ]);
    expect(evaluateActivate(input).verdict).toBe('not-applicable');
  });

  it('is not judged when the arrow key did not move focus', () => {
    const input = walk('activate-enter', onTab('Overview'), [
      ['ArrowRight', onTab('Overview')],
      ['Enter', onTab('Overview')],
    ]);
    expect(evaluateActivate(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Focus did not reach another tab',
    });
  });
});

describe('selected', () => {
  it('follows when one tab is selected at every moment', () => {
    const input = walk('move', onTab('Overview'), [['ArrowRight', onTab('Activity')]]);
    expect(evaluateSelected(input)).toMatchObject({ verdict: 'follows', judgedSteps: 2 });
  });

  it('differs when the tree gives a tab no selected state', () => {
    const stateless = set(onTab('Activity'), { selected: [false, true, undefined, false] });
    const input = walk('move', onTab('Overview'), [['ArrowRight', stateless]]);
    expect(evaluateSelected(input).reason).toBe(
      'After ArrowRight (step 1), the tree gave "Members" no selected state.',
    );
  });

  it('differs when two tabs are selected', () => {
    const two = set(onTab('Activity'), { selected: [true, true, false, false] });
    const input = walk('move', onTab('Overview'), [['ArrowRight', two]]);
    expect(evaluateSelected(input).reason).toBe(
      'After ArrowRight (step 1), 2 tabs were selected (Overview, Activity).',
    );
  });

  it('is not judged when no tab was in the tree', () => {
    const none = { ...onTab('Overview'), tabSet: { tabs: [], panels: [] } };
    expect(evaluateSelected(walk('move', none, [['ArrowRight', none]])).verdict).toBe(
      'inconclusive',
    );
  });
});

describe('panel', () => {
  it('follows when the one shown panel is named by the active tab', () => {
    const input = walk('move', onTab('Overview'), [['ArrowRight', onTab('Activity')]]);
    expect(evaluatePanel(input)).toMatchObject({ verdict: 'follows', judgedSteps: 2 });
  });

  it('differs when the selection moved and the old panel stayed', () => {
    const stale = {
      ...onTab('Activity'),
      tabSet: { ...tabSet('Activity'), panels: tabSet('Overview').panels },
    };
    const input = walk('move', onTab('Overview'), [['ArrowRight', stale]]);
    expect(evaluatePanel(input).reason).toBe(
      'After ArrowRight (step 1), the shown panel was named "Overview" while "Activity" was the active tab.',
    );
  });

  it('differs when two panels are shown', () => {
    const both = set(onTab('Overview'), { panels: ['Overview', 'Activity'] });
    expect(evaluatePanel(walk('move', both, [['ArrowRight', both]])).summary).toBe(
      'Shown panel does not match its tab',
    );
  });

  it('does not charge a missing selection twice: any tab may name the panel then', () => {
    const noneSelected = set(onTab('Overview'), { selected: [false, false, false, false] });
    expect(evaluatePanel(walk('move', noneSelected, [['ArrowRight', noneSelected]])).verdict).toBe(
      'follows',
    );
  });

  it('is not judged when a step did not settle', () => {
    const input = walk('move', onTab('Overview'), [['ArrowRight', onTab('Activity')]]);
    const unsettled = {
      ...input,
      steps: input.steps.map((s) => ({ ...s, settle: { ms: 1000, quiet: false } })),
    };
    expect(evaluatePanel(unsettled).verdict).toBe('inconclusive');
  });
});
