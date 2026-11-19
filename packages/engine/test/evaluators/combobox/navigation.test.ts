import { describe, expect, it } from 'vitest';
import { evaluateArrows } from '../../../src/evaluators/combobox/arrows.ts';
import { evaluateDown } from '../../../src/evaluators/combobox/down.ts';
import { evaluateFocusStays } from '../../../src/evaluators/combobox/focus-stays.ts';
import { evaluateSelected } from '../../../src/evaluators/combobox/selected.ts';
import {
  active,
  closed,
  combobox,
  focusedOption,
  fruit,
  open,
  popup,
  press,
  type,
  walk,
  type Moment,
} from './fixtures.ts';

const down = press('ArrowDown');
const up = press('ArrowUp');

/** type "a", Down, Down, Up through the given moments. */
const typeThenMoveFrom = (typed: Moment, [afterDown, afterSecond, afterUp]: readonly Moment[]) =>
  walk('type-then-move', closed(), [
    [type('a'), typed],
    [down, afterDown!],
    [down, afterSecond!],
    [up, afterUp!],
  ]);
const typeThenMove = (...moments: readonly Moment[]) => typeThenMoveFrom(open(), moments);

const manual = typeThenMove(active('Apple'), active('Apricot'), active('Apple'));
const automatic = typeThenMoveFrom(active('Apple'), [
  active('Apricot'),
  active('Avocado'),
  active('Apricot'),
]);
const domFocus = typeThenMove(
  focusedOption('Apple'),
  focusedOption('Apricot'),
  focusedOption('Apple'),
);
const nothingHappens = typeThenMove(open(), open(), open());

/** An option is marked selected, focus stays, and aria-activedescendant is never set. */
const marked = (name: string): Moment => ({
  focus: combobox({ value: 'a', states: { expanded: true } }),
  popup: popup(fruit, name),
});
const selectedOnly = typeThenMove(marked('Apple'), marked('Apricot'), marked('Apple'));

const dangling: Moment = {
  focus: combobox({ value: 'a', states: { expanded: true }, activeDescendantUnresolved: true }),
  popup: popup(fruit),
};

describe('evaluateDown', () => {
  it('follows when Down Arrow makes the first option active', () => {
    expect(evaluateDown(manual)).toMatchObject({
      verdict: 'follows',
      summary: 'Down Arrow goes to the first option',
    });
  });

  it('follows when it goes to the option after an automatically selected one', () => {
    expect(evaluateDown(automatic)).toMatchObject({
      verdict: 'follows',
      summary: 'Down Arrow goes past the automatic choice',
    });
  });

  it('follows for a system that moves DOM focus: that design is charged elsewhere', () => {
    expect(evaluateDown(domFocus).verdict).toBe('follows');
  });

  it('differs when options are shown and Down Arrow makes none active', () => {
    expect(evaluateDown(nothingHappens)).toMatchObject({
      verdict: 'differs',
      reason: 'With 3 options shown, Down Arrow made none of them active.',
    });
  });

  it('differs when Down Arrow opens the popup and makes no option active', () => {
    const input = walk('open-down', closed(), [[down, open(fruit, '')]]);
    expect(evaluateDown(input)).toMatchObject({
      verdict: 'differs',
      summary: 'Down Arrow opens, no option active',
      reason: 'Down Arrow showed the popup with 3 options and made none of them active.',
    });
  });

  it('does not judge a combobox that stays closed on Down Arrow while empty', () => {
    const input = walk('open-down', closed(), [[down, closed()]]);
    expect(evaluateDown(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Does not open on Down Arrow while empty',
    });
  });

  it('leaves a reference that leads nowhere to focus-stays', () => {
    const input = typeThenMove(dangling, dangling, dangling);
    expect(evaluateDown(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Points at no option',
    });
  });

  it('cannot tell a visual-only automatic choice: the second option with no mark before', () => {
    const input = typeThenMove(active('Apricot'), active('Avocado'), active('Apricot'));
    expect(evaluateDown(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Second option, no readable mark before',
    });
  });
});

describe('evaluateFocusStays', () => {
  it('follows when focus stays and aria-activedescendant names the active option', () => {
    expect(evaluateFocusStays(manual)).toMatchObject({
      verdict: 'follows',
      reason:
        'In 3 arrow key steps DOM focus stayed on the combobox and aria-activedescendant named the active option.',
    });
  });

  it('says one arrow key step in the singular', () => {
    const one = walk('open-down', closed(), [[press('ArrowDown'), active('Apple')]]);
    expect(evaluateFocusStays(one).reason).toBe(
      'In 1 arrow key step DOM focus stayed on the combobox and aria-activedescendant named the active option.',
    );
  });

  it('differs when DOM focus moves onto the options', () => {
    expect(evaluateFocusStays(domFocus)).toMatchObject({
      verdict: 'differs',
      summary: 'DOM focus moves onto the options',
      reason: 'After step 2, DOM focus moved onto option "Apple".',
    });
  });

  it('differs when an option is marked selected and the reference is not set', () => {
    expect(evaluateFocusStays(selectedOnly)).toMatchObject({
      verdict: 'differs',
      summary: 'Active option is not referenced',
    });
  });

  it('differs when aria-activedescendant names an element that does not exist', () => {
    expect(evaluateFocusStays(typeThenMove(dangling, dangling, dangling))).toMatchObject({
      verdict: 'differs',
      reason: 'After step 2, aria-activedescendant named an element that does not exist.',
    });
  });

  it('is not judged when no arrow key changed anything: charged to down', () => {
    expect(evaluateFocusStays(nothingHappens)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'No option became active',
    });
  });
});

describe('evaluateArrows', () => {
  it('follows when Down and Up Arrow move to the neighbours', () => {
    expect(evaluateArrows(manual)).toMatchObject({ verdict: 'follows' });
    expect(evaluateArrows(domFocus).verdict).toBe('follows');
    expect(evaluateArrows(selectedOnly).verdict).toBe('follows');
  });

  it('differs when an arrow key skips an option', () => {
    const input = typeThenMove(active('Apple'), active('Avocado'), active('Apricot'));
    expect(evaluateArrows(input)).toMatchObject({
      verdict: 'differs',
      reason:
        'In step 3, from option 1, Down Arrow made option 3, "Avocado" active; option 2 was expected.',
    });
  });

  it('is not judged when no option became active', () => {
    expect(evaluateArrows(nothingHappens)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'No option became active',
    });
  });
});

describe('evaluateArrows at the ends', () => {
  const ends = (afterLast: Moment, afterFirst: Moment) =>
    walk('ends', closed(), [
      [type('a'), open()],
      [down, active('Apple')],
      [down, active('Apricot')],
      [down, active('Avocado')],
      [down, afterLast],
      [up, afterFirst],
    ]);

  it('follows when the list wraps, as the APG list example does', () => {
    expect(evaluateArrows(ends(active('Apple'), active('Avocado')))).toMatchObject({
      verdict: 'follows',
      reason: 'Down Arrow at the last option wraps; Up Arrow at the first option wraps.',
    });
  });

  it('follows when the key does nothing at the end', () => {
    const input = walk('ends', closed(), [
      [type('a'), open()],
      [down, active('Apple')],
      [up, active('Apple')],
    ]);
    expect(evaluateArrows(input)).toMatchObject({
      verdict: 'follows',
      reason: 'Up Arrow at the first option stays.',
    });
  });

  it('follows when the key returns to the combobox', () => {
    const input = walk('ends', closed(), [
      [type('a'), open()],
      [down, active('Apple')],
      [up, open()],
    ]);
    expect(evaluateArrows(input).reason).toBe(
      'Up Arrow at the first option returns to the combobox.',
    );
  });

  it('differs when the key at the end closes the popup', () => {
    const input = walk('ends', closed(), [
      [type('a'), open()],
      [down, active('Apple')],
      [up, closed('a')],
    ]);
    expect(evaluateArrows(input)).toMatchObject({
      verdict: 'differs',
      summary: 'Unexpected move at the end of the list',
    });
  });

  it('is not judged when no end was reached', () => {
    const input = walk('ends', closed(), [
      [type('a'), open()],
      [down, open()],
    ]);
    expect(evaluateArrows(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'No end of the list reached',
    });
  });
});

describe('evaluateSelected', () => {
  it('follows when only the active option is exposed as selected', () => {
    expect(evaluateSelected(manual)).toMatchObject({
      verdict: 'follows',
      reason: 'In 3 steps the active option, and no other, was exposed as selected.',
    });
  });

  it('differs when the active option is not exposed as selected', () => {
    const unmarked = (name: string): Moment => ({ ...active(name), popup: popup(fruit) });
    const input = typeThenMove(unmarked('Apple'), unmarked('Apricot'), unmarked('Apple'));
    expect(evaluateSelected(input)).toMatchObject({
      verdict: 'differs',
      reason: 'After step 2, "Apple" was active and no option was exposed as selected.',
    });
  });

  it('differs when a second option is selected too', () => {
    const both: Moment = { ...active('Apricot'), popup: popup(fruit, ['Apple', 'Apricot']) };
    const input = typeThenMove(active('Apple'), both, active('Apple'));
    expect(evaluateSelected(input)).toMatchObject({
      verdict: 'differs',
      reason: 'After step 3, "Apricot" was active and "Apple", "Apricot" was exposed as selected.',
    });
  });

  it('is not judged when no option became active', () => {
    expect(evaluateSelected(nothingHappens).verdict).toBe('inconclusive');
  });
});
