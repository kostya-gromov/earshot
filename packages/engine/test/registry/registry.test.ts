import { describe, expect, it } from 'vitest';
import { registeredPatterns } from '../../src/registry/index.ts';

describe('registeredPatterns', () => {
  it('exposes input-with-chips metadata without leaking state generics', () => {
    const registration = registeredPatterns.get('input-with-chips');

    expect(registration?.scenarioIds).toEqual([
      'chip-tab',
      'chip-shift-tab',
      'chip-arrows',
      'tab-out',
      'shift-tab-out',
      'tab-from-chip',
      'backspace-twice',
      'arrows',
      'delete-focused',
      'remove-click',
    ]);
    expect(registration?.targetIds).toEqual([
      'reference',
      'atlassian',
      'fluent',
      'primer',
      'mui',
      'react-aria',
      'chakra',
    ]);
  });
});
