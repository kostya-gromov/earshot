import { describe, expect, it } from 'vitest';
import { evaluateArrows } from '../../../src/evaluators/select/arrows.ts';
import { evaluateDown } from '../../../src/evaluators/select/down.ts';
import { evaluateExpanded } from '../../../src/evaluators/select/expanded.ts';
import { evaluateFocusStays } from '../../../src/evaluators/select/focus-stays.ts';
import { evaluateSelected } from '../../../src/evaluators/select/selected.ts';
import {
  active,
  closed,
  elsewhere,
  focusedList,
  focusedOption,
  options,
  selectNode,
  walk,
} from './fixtures.ts';
import type { Moment } from './fixtures.ts';

const openTo = (after: Moment) => walk('open', closed(), [['ArrowDown', after]]);

/** Open on Banana, then each name in turn after one key. */
function move(...path: readonly (readonly [string, string])[]) {
  return walk('move', closed(), [
    ['ArrowDown', active('Banana')],
    ...path.map(([key, name]) => [key, active(name)] as const),
  ]);
}

describe('evaluateDown', () => {
  it('follows and records which option opened active', () => {
    expect(evaluateDown(openTo(active('Banana')))).toMatchObject({
      verdict: 'follows',
      reason: 'Down Arrow showed 5 options, with "Banana" active, named by aria-activedescendant.',
    });
  });

  it('differs when the list does not open', () => {
    expect(evaluateDown(openTo(closed())).verdict).toBe('differs');
  });

  it('differs when the list opens with no active option', () => {
    const none: Moment = {
      ...active('Banana', { selected: [] }),
      focus: closed({ expanded: true }).focus,
    };
    expect(evaluateDown(openTo(none))).toMatchObject({
      summary: 'The list opens with no active option',
    });
  });

  it('leaves a reference to nothing to focus-stays', () => {
    const lost = active('Banana', { selected: [] });
    const focus = {
      ...closed({ expanded: true }).focus,
      activeDescendantUnresolved: true as const,
    };
    expect(evaluateDown(openTo({ ...lost, focus })).verdict).toBe('inconclusive');
  });
});

describe('evaluateExpanded', () => {
  it('follows when expanded matches the list after each step on the select', () => {
    expect(evaluateExpanded(move(['ArrowDown', 'Cherry']))).toMatchObject({ judgedSteps: 2 });
  });

  it('differs when the select says collapsed with options shown', () => {
    const collapsed = { ...active('Banana'), focus: closed().focus };
    expect(evaluateExpanded(openTo(collapsed)).verdict).toBe('differs');
  });

  it('is not judged when focus is never on the select, says so, and says no step was judged', () => {
    const input = walk('open', elsewhere(), [['ArrowDown', elsewhere()]]);
    expect(evaluateExpanded(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Focus was not on the select',
      judgedSteps: 0,
    });
  });

  it('says when only the collapsed state could be judged (verdict audit, 2026-11-24)', () => {
    // DOM focus on the option while the list is shown: that step is not judged here.
    const input = walk('enter', closed(), [
      ['ArrowDown', focusedOption('Banana')],
      ['Enter', closed()],
    ]);
    expect(evaluateExpanded(input)).toMatchObject({
      verdict: 'follows',
      summary: 'Collapsed matches; the list shown was not judged',
    });
  });

  it('tells a select that exposes no expanded state apart from focus elsewhere', () => {
    const stateless: Moment = { ...closed(), focus: { ...closed().focus, states: {} } };
    expect(evaluateExpanded(openTo(stateless))).toMatchObject({
      summary: 'No expanded state to read',
    });
  });
});

describe('evaluateFocusStays', () => {
  it('follows when aria-activedescendant names each active option', () => {
    expect(evaluateFocusStays(move(['ArrowDown', 'Cherry'])).verdict).toBe('follows');
  });

  it('differs when DOM focus moves onto the options', () => {
    expect(evaluateFocusStays(openTo(focusedOption('Banana')))).toMatchObject({
      summary: 'DOM focus moves onto the options',
    });
  });

  it('differs when DOM focus moves onto the list itself (Chakra UI, 2026-11-24)', () => {
    expect(evaluateFocusStays(openTo(focusedList('Banana')))).toMatchObject({
      verdict: 'differs',
      reason: 'After step 1, DOM focus moved onto listbox "Fruit".',
    });
  });

  it('differs when an option is only marked selected', () => {
    const marked: Moment = {
      focus: closed({ expanded: true }).focus,
      popup: {
        present: true,
        options: options(['Banana']),
        opener: selectNode({ expanded: true }),
      },
    };
    expect(evaluateFocusStays(openTo(marked))).toMatchObject({
      summary: 'Active option is not referenced',
    });
  });

  it('is not judged when no option became active', () => {
    expect(evaluateFocusStays(openTo(closed())).verdict).toBe('inconclusive');
  });
});

describe('evaluateArrows', () => {
  it('follows for moves, and at the ends for a key that does not move on', () => {
    expect(
      evaluateArrows(
        move(
          ['ArrowDown', 'Cherry'],
          ['ArrowDown', 'Date'],
          ['ArrowDown', 'Date'],
          ['ArrowUp', 'Cherry'],
        ),
      ),
    ).toMatchObject({
      verdict: 'follows',
      reason:
        'In 3 steps an arrow key moved to the next or previous option. At an end of the list: stayed (1). APG names doing nothing and returning to the select, and does not rule out moving on.',
    });
  });

  it('follows when Down Arrow at the last option moves on to the first, and records it (2026-11-24)', () => {
    expect(
      evaluateArrows(move(['ArrowDown', 'Cherry'], ['ArrowDown', 'Date'], ['ArrowDown', 'Apple'])),
    ).toMatchObject({
      verdict: 'follows',
      reason:
        'In 2 steps an arrow key moved to the next or previous option. At an end of the list: moved on to the other end (1). APG names doing nothing and returning to the select, and does not rule out moving on.',
    });
  });

  it('follows when a key at an end leaves no option active and focus on the select', () => {
    const select = selectNode({ expanded: true });
    const returned: Moment = {
      focus: { ...closed().focus, ...select },
      popup: { present: true, options: options(), opener: select },
    };
    expect(evaluateArrows(move(['ArrowDown', 'Cherry'], ['ArrowDown', 'Date']))).toMatchObject({
      verdict: 'follows',
    });
    const input = walk('move', closed(), [
      ['ArrowDown', active('Banana')],
      ['ArrowDown', active('Cherry')],
      ['ArrowDown', active('Date')],
      ['ArrowDown', returned],
    ]);
    expect(evaluateArrows(input).reason).toContain('returned to the select (1)');
  });

  it('differs when a key at an end leaves no option active and focus off the select (audit, 2026-11-24)', () => {
    const input = walk('move', closed(), [
      ['ArrowDown', active('Banana')],
      ['ArrowDown', active('Cherry')],
      ['ArrowDown', active('Date')],
      ['ArrowDown', elsewhere()],
    ]);
    expect(evaluateArrows(input)).toMatchObject({
      verdict: 'differs',
      reason:
        'In step 4, Down Arrow at the last option left no option active, and focus was on textbox "Notes", not on the select.',
    });
  });

  it('differs when a key at an end lands on an option that is not the other end', () => {
    expect(
      evaluateArrows(move(['ArrowDown', 'Cherry'], ['ArrowDown', 'Date'], ['ArrowDown', 'Banana'])),
    ).toMatchObject({
      verdict: 'differs',
      reason: 'In step 4, Down Arrow at the last option made option 3, "Banana" active.',
    });
  });

  it('is not judged when no option became active', () => {
    expect(evaluateArrows(walk('move', closed(), [['ArrowDown', closed()]])).verdict).toBe(
      'inconclusive',
    );
  });
});

describe('evaluateSelected', () => {
  it('follows when only the active option is selected', () => {
    expect(evaluateSelected(move(['ArrowDown', 'Cherry'])).verdict).toBe('follows');
  });

  it('differs when the chosen value stays selected beside the active option', () => {
    const both = walk('move', closed(), [
      ['ArrowDown', active('Banana')],
      ['ArrowDown', active('Cherry', { selected: ['Banana'] })],
    ]);
    expect(evaluateSelected(both)).toMatchObject({
      verdict: 'differs',
      reason: 'After step 2, "Cherry" was active and "Banana" was exposed as selected.',
    });
  });

  it('is not judged when no option became active', () => {
    expect(evaluateSelected(walk('move', closed(), [['ArrowDown', closed()]])).verdict).toBe(
      'inconclusive',
    );
  });
});
