import { describe, expect, it } from 'vitest';
import { evaluateArrows } from '../../../src/evaluators/menu-button/arrows.ts';
import { evaluateHomeEnd } from '../../../src/evaluators/menu-button/home-end.ts';
import { closed, on, openUnfocused, walk } from './fixtures.ts';

describe('arrows', () => {
  it('follows a move down and back up', () => {
    const input = walk('move', [
      ['Enter', on('Rename')],
      ['ArrowDown', on('Duplicate')],
      ['ArrowUp', on('Rename')],
    ]);
    expect(evaluateArrows(input)).toMatchObject({
      verdict: 'follows',
      reason:
        'In 2 arrow key steps the active item moved to the next or the previous item, or stayed or wrapped at an end.',
    });
  });

  it('follows wrapping at both ends, and staying at them', () => {
    const wraps = walk('ends', [
      ['Enter', on('Rename')],
      ['ArrowUp', on('Delete')],
      ['ArrowDown', on('Rename')],
    ]);
    const stays = walk('ends', [
      ['Enter', on('Rename')],
      ['ArrowUp', on('Rename')],
    ]);
    expect(evaluateArrows(wraps).verdict).toBe('follows');
    expect(evaluateArrows(stays).verdict).toBe('follows');
  });

  // Whether a disabled item is a stop is the question of "disabled", not of this rule.
  it('follows a menu that stops on the disabled item, and one that skips it', () => {
    const stops = walk('ends', [
      ['Enter', on('Duplicate')],
      ['ArrowDown', on('Archive')],
      ['ArrowDown', on('Delete')],
    ]);
    const skips = walk('ends', [
      ['Enter', on('Duplicate')],
      ['ArrowDown', on('Delete')],
    ]);
    expect(evaluateArrows(stops).verdict).toBe('follows');
    expect(evaluateArrows(skips).verdict).toBe('follows');
  });

  it('differs when an arrow key jumps over an item that can be activated', () => {
    const input = walk('move', [
      ['Enter', on('Rename')],
      ['ArrowDown', on('Delete')],
    ]);
    expect(evaluateArrows(input)).toMatchObject({
      verdict: 'differs',
      reason: 'ArrowDown from "Rename" (1 of 4) went to "Delete" (4 of 4).',
    });
  });

  it('differs when an arrow key leaves no item active', () => {
    const input = walk('move', [
      ['Enter', on('Rename')],
      ['ArrowDown', openUnfocused()],
    ]);
    expect(evaluateArrows(input).reason).toBe(
      'ArrowDown from "Rename" (1 of 4) left no item active: focus was on button "Actions".',
    );
  });

  it('is not judged when no arrow key was pressed with an active item', () => {
    const input = walk('move', [
      ['Enter', closed()],
      ['ArrowDown', closed()],
    ]);
    expect(evaluateArrows(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'No arrow key with an active item',
    });
  });
});

describe('home-end', () => {
  const run = (afterUp: string, afterEnd: string, afterHome: string) =>
    walk('home-end', [
      ['Enter', on('Rename')],
      ['ArrowUp', on(afterUp)],
      ['Home', on('Rename')],
      ['End', on(afterEnd)],
      ['Home', on(afterHome)],
    ]);

  it('follows where the arrows do not wrap and both keys reach the ends', () => {
    expect(evaluateHomeEnd(run('Rename', 'Delete', 'Rename'))).toMatchObject({
      verdict: 'follows',
      summary: 'Home and End reach the ends',
    });
  });

  it('differs where the arrows do not wrap and End does nothing', () => {
    expect(evaluateHomeEnd(run('Rename', 'Rename', 'Rename'))).toMatchObject({
      verdict: 'differs',
      reason: 'The arrows do not wrap, and End made "Rename" active, not the last item.',
    });
  });

  // Optional behavior is recorded, not judged: with wrapping, having the two keys is no more
  // "following" than not having them.
  it('is not applicable where the arrows wrap, whether or not the two keys work', () => {
    expect(evaluateHomeEnd(run('Delete', 'Delete', 'Rename'))).toMatchObject({
      verdict: 'not-applicable',
      summary: 'Arrows wrap',
      reason:
        'Up Arrow at the first item wrapped to "Delete", so APG does not ask for Home and End here. End made "Delete" active and Home "Rename" (recorded, not judged).',
    });
    expect(evaluateHomeEnd(run('Delete', 'Rename', 'Rename')).verdict).toBe('not-applicable');
  });

  it('is not judged when the menu was not open on its first item', () => {
    const input = walk('home-end', [
      ['Enter', closed()],
      ['ArrowUp', closed()],
      ['Home', closed()],
      ['End', closed()],
      ['Home', closed()],
    ]);
    expect(evaluateHomeEnd(input).verdict).toBe('inconclusive');
  });
});
