import { describe, expect, it } from 'vitest';
import { summarizeBackspace } from '../../src/lib/backspace-summary';
import type { ReplayStep } from '../../src/lib/replay';

const step = (to: 'chip' | 'input', removed: string[] = []) =>
  ({ to: { kind: to }, removed }) as unknown as ReplayStep;

describe('summarizeBackspace', () => {
  it('counts what one press did across the systems, in plain words', () => {
    expect(
      summarizeBackspace([
        step('input', ['Hiroshi Matsui']),
        step('chip'),
        step('chip'),
        step('input'),
        undefined,
      ]),
    ).toBe(
      'Backspace pressed in 5 systems: 1 removed a chip, 2 moved focus to a chip, 2 changed nothing in the accessibility tree.',
    );
  });

  it('leaves out outcomes no system had', () => {
    expect(summarizeBackspace([step('chip'), step('chip')])).toBe(
      'Backspace pressed in 2 systems: 2 moved focus to a chip.',
    );
  });
});
