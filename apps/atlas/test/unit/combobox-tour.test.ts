import { describe, expect, it } from 'vitest';
import {
  comboboxRulesLitBy,
  heardSuggestions,
  initialComboboxTour,
  observeComboboxKey,
  type ComboboxSnapshot,
} from '../../src/features/playground/combobox-tour';

const closed: ComboboxSnapshot = { focusOnInput: true, isOpen: false, active: null, value: '' };
const open = (active: string | null, value = 'a'): ComboboxSnapshot => ({
  focusOnInput: true,
  isOpen: true,
  active,
  value,
});

const press = (key: string, before: ComboboxSnapshot, after: ComboboxSnapshot) => ({
  key,
  before,
  after,
});

describe('combobox tour', () => {
  it('completes "down" when Down Arrow opens a closed list on an option', () => {
    const tour = observeComboboxKey(initialComboboxTour, press('ArrowDown', closed, open('Apple')));
    expect(tour.done).toEqual(['down']);
  });

  it('does not complete "down" when the list was already open', () => {
    const tour = observeComboboxKey(
      initialComboboxTour,
      press('ArrowDown', open(null), open('Apple')),
    );
    expect(tour.done).toEqual([]);
  });

  it('completes "arrows" only after a move down and a move back up, in that order', () => {
    let tour = observeComboboxKey(
      initialComboboxTour,
      press('ArrowUp', open('Apricot'), open('Apple')),
    );
    expect(tour.done).toEqual([]);
    // Entering the list from the text is not yet a move between options.
    tour = observeComboboxKey(tour, press('ArrowDown', open(null), open('Apple')));
    tour = observeComboboxKey(tour, press('ArrowUp', open('Apple'), open('Avocado')));
    expect(tour.done).toEqual([]);
    tour = observeComboboxKey(tour, press('ArrowDown', open('Apple'), open('Apricot')));
    tour = observeComboboxKey(tour, press('ArrowUp', open('Apricot'), open('Apple')));
    expect(tour.done).toEqual(['arrows']);
  });

  it('does not count a move that took DOM focus out of the input', () => {
    const left = { ...open('Apricot'), focusOnInput: false };
    let tour = observeComboboxKey(initialComboboxTour, press('ArrowDown', open('Apple'), left));
    tour = observeComboboxKey(tour, press('ArrowUp', open('Apricot'), open('Apple')));
    expect(tour.done).toEqual([]);
  });

  it('completes "enter" when the active option becomes the value and the list closes', () => {
    const accepted = { ...closed, value: 'Apple' };
    expect(
      observeComboboxKey(initialComboboxTour, press('Enter', open('Apple'), accepted)).done,
    ).toEqual(['enter']);
  });

  it('does not complete "enter" with no active option, or when the text did not change to it', () => {
    expect(
      observeComboboxKey(initialComboboxTour, press('Enter', open(null), open(null))).done,
    ).toEqual([]);
    expect(
      observeComboboxKey(
        initialComboboxTour,
        press('Enter', open('Apple'), { ...closed, value: 'a' }),
      ).done,
    ).toEqual([]);
  });

  it('completes "say-results" on a message that says how many suggestions there are', () => {
    expect(heardSuggestions(initialComboboxTour, '3 suggestions').done).toEqual(['say-results']);
    expect(heardSuggestions(initialComboboxTour, 'No suggestions').done).toEqual(['say-results']);
    expect(heardSuggestions(initialComboboxTour, 'Apple').done).toEqual([]);
  });

  it('completes a rule once', () => {
    const once = observeComboboxKey(initialComboboxTour, press('ArrowDown', closed, open('Apple')));
    expect(observeComboboxKey(once, press('ArrowDown', closed, open('Apple'))).done).toEqual([
      'down',
    ]);
  });
});

describe('rules a key lights', () => {
  it('lights "down" in a closed field and "arrows" in an open list', () => {
    expect(comboboxRulesLitBy('ArrowDown', closed)).toEqual(['down']);
    expect(comboboxRulesLitBy('ArrowDown', open('Apple'))).toEqual(['arrows']);
    expect(comboboxRulesLitBy('ArrowUp', open('Apple'))).toEqual(['arrows']);
  });

  it('lights "enter" only with an active option, and nothing outside the input', () => {
    expect(comboboxRulesLitBy('Enter', open('Apple'))).toEqual(['enter']);
    expect(comboboxRulesLitBy('Enter', open(null))).toEqual([]);
    expect(comboboxRulesLitBy('ArrowDown', { ...closed, focusOnInput: false })).toEqual([]);
  });
});
