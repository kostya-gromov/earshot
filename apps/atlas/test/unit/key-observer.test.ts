import { describe, expect, it } from 'vitest';
import type { FieldSnapshot, KeyObservation } from '../../src/features/playground/chips-tour';
import { createKeyObserver } from '../../src/features/playground/key-observer';

const field = (chipCount: number): FieldSnapshot => ({
  focusInField: true,
  focusOnInput: false,
  focusOnChip: true,
  inputEmpty: true,
  chipCount,
});

describe('createKeyObserver', () => {
  it('reports a key with the field before it and after it settled', () => {
    const seen: KeyObservation[] = [];
    const observer = createKeyObserver<FieldSnapshot>((observation) => seen.push(observation));
    const id = observer.keyDown('Backspace', field(3));
    observer.settle(id, field(2));
    expect(seen).toEqual([{ key: 'Backspace', before: field(3), after: field(2) }]);
  });

  it('uses the field before the next key when keys come faster than settling', () => {
    const seen: KeyObservation[] = [];
    const observer = createKeyObserver<FieldSnapshot>((observation) => seen.push(observation));
    const first = observer.keyDown('ArrowLeft', field(3));
    const second = observer.keyDown('ArrowRight', field(4));
    observer.settle(first, field(5)); // too late: the next key already closed it
    observer.settle(second, field(6));
    expect(seen).toEqual([
      { key: 'ArrowLeft', before: field(3), after: field(4) },
      { key: 'ArrowRight', before: field(4), after: field(6) },
    ]);
  });
});
