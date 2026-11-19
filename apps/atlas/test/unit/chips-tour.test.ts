import { describe, expect, it } from 'vitest';
import {
  heardMessage,
  initialTour,
  observeKey,
  rulesLitBy,
  type FieldSnapshot,
} from '../../src/features/playground/chips-tour';

const inInput: FieldSnapshot = {
  focusInField: true,
  focusOnInput: true,
  focusOnChip: false,
  inputEmpty: true,
  chipCount: 3,
};
const onChip: FieldSnapshot = { ...inInput, focusOnInput: false, focusOnChip: true };
const outside: FieldSnapshot = { ...inInput, focusInField: false, focusOnInput: false };

const press = (key: string, before: FieldSnapshot, after: FieldSnapshot) => ({
  key,
  before,
  after,
});

describe('chips tour', () => {
  it('counts Backspace twice only as focus-then-remove, in that order', () => {
    let tour = observeKey(initialTour, press('Backspace', inInput, onChip));
    expect(tour.done).toEqual([]);
    tour = observeKey(tour, press('Backspace', onChip, { ...onChip, chipCount: 2 }));
    expect(tour.done).toEqual(['bsp']);
  });

  it('does not count a Backspace that removes from the input directly', () => {
    const tour = observeKey(initialTour, press('Backspace', onChip, { ...onChip, chipCount: 2 }));
    expect(tour.done).toEqual([]);
  });

  it('counts arrows after stepping into the chips and back out to the input', () => {
    let tour = observeKey(initialTour, press('ArrowLeft', inInput, onChip));
    tour = observeKey(tour, press('ArrowRight', onChip, inInput));
    expect(tour.done).toEqual(['arrows']);
  });

  it('counts Tab when one press leaves the field', () => {
    expect(observeKey(initialTour, press('Tab', inInput, outside)).done).toEqual(['tab']);
    expect(observeKey(initialTour, press('Tab', inInput, onChip)).done).toEqual([]);
  });

  it('counts say when an addition is announced', () => {
    expect(heardMessage(initialTour, 'Ana Lima added. 4 selected').done).toEqual(['say']);
    expect(heardMessage(initialTour, 'Greg Fisher removed. 2 selected').done).toEqual([]);
  });

  it('never counts a rule twice', () => {
    const once = heardMessage(initialTour, 'Ana Lima added. 4 selected');
    expect(heardMessage(once, 'Ben Carter added. 5 selected').done).toEqual(['say']);
  });

  it('lights the rules a key exercises; say lights on what is heard, not on a key', () => {
    expect(rulesLitBy('Backspace')).toEqual(['bsp']);
    expect(rulesLitBy('ArrowLeft')).toEqual(['arrows']);
    expect(rulesLitBy('Shift+Tab')).toEqual(['tab']);
    expect(rulesLitBy('a')).toEqual([]);
  });
});
