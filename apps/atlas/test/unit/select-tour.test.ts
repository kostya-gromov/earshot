import { describe, expect, it } from 'vitest';
import {
  initialSelectTour,
  observeSelectKey,
  selectRulesLitBy,
  type SelectSnapshot,
} from '../../src/features/playground/select-tour';

const closed = (value = 'Banana'): SelectSnapshot => ({
  focusOnSelect: true,
  isOpen: false,
  active: null,
  value,
});
const open = (active: string | null, value = 'Banana'): SelectSnapshot => ({
  focusOnSelect: true,
  isOpen: true,
  active,
  value,
});
const press = (key: string, before: SelectSnapshot, after: SelectSnapshot) => ({
  key,
  before,
  after,
});

describe('select tour', () => {
  it('completes "down" when Down Arrow opens the closed select on an option', () => {
    const tour = observeSelectKey(initialSelectTour, press('ArrowDown', closed(), open('Banana')));
    expect(tour.done).toEqual(['down']);
  });

  it('completes "arrows" only after a move down and a move back up, focus on the select', () => {
    let tour = observeSelectKey(
      initialSelectTour,
      press('ArrowUp', open('Banana'), open('Apricot')),
    );
    expect(tour.done).toEqual([]);
    tour = observeSelectKey(tour, press('ArrowDown', open('Apricot'), open('Banana')));
    tour = observeSelectKey(tour, press('ArrowUp', open('Banana'), open('Apricot')));
    expect(tour.done).toEqual(['arrows']);
  });

  it('completes "enter" when Enter makes the active option the value and closes the list', () => {
    const tour = observeSelectKey(
      initialSelectTour,
      press('Enter', open('Cherry'), closed('Cherry')),
    );
    expect(tour.done).toEqual(['enter']);
  });

  it('completes "escape" when Escape closes the list and the value stays', () => {
    const kept = observeSelectKey(
      initialSelectTour,
      press('Escape', open('Cherry'), closed('Banana')),
    );
    expect(kept.done).toEqual(['escape']);
    const changed = observeSelectKey(
      initialSelectTour,
      press('Escape', open('Cherry'), closed('Cherry')),
    );
    expect(changed.done).toEqual([]);
  });

  it('lights the rules a key exercises, only with focus on the select', () => {
    expect(selectRulesLitBy('ArrowDown', closed())).toEqual(['down']);
    expect(selectRulesLitBy('ArrowDown', open('Banana'))).toEqual(['arrows', 'selected']);
    expect(selectRulesLitBy('Escape', open('Banana'))).toEqual(['escape', 'escape-keeps-value']);
    expect(selectRulesLitBy('ArrowDown', { ...closed(), focusOnSelect: false })).toEqual([]);
  });
});
