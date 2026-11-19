import { describe, expect, it } from 'vitest';
import { createSelection } from '../input-with-chips/selection.ts';

describe('selection', () => {
  it('adds a name once, with whitespace normalised', () => {
    const selection = createSelection(['Irene Oh']);
    expect(selection.add('  Greg   Fisher ')).toEqual({ status: 'added', name: 'Greg Fisher' });
    expect(selection.list()).toEqual(['Irene Oh', 'Greg Fisher']);
  });

  it('reports duplicates and empty input without changing the list', () => {
    const selection = createSelection(['Irene Oh']);
    expect(selection.add('Irene  Oh')).toEqual({ status: 'duplicate', name: 'Irene Oh' });
    expect(selection.add('   ')).toEqual({ status: 'empty' });
    expect(selection.count()).toBe(1);
  });

  it('removes by index and returns the removed name', () => {
    const selection = createSelection(['Irene Oh', 'Greg Fisher', 'Hiroshi Matsui']);
    expect(selection.removeAt(1)).toBe('Greg Fisher');
    expect(selection.list()).toEqual(['Irene Oh', 'Hiroshi Matsui']);
  });

  it('does not let callers mutate its state through list()', () => {
    const initial = ['Irene Oh'];
    const selection = createSelection(initial);
    (selection.list() as string[]).push('Intruder');
    initial.push('Intruder');
    expect(selection.list()).toEqual(['Irene Oh']);
  });
});
