import { describe, expect, it } from 'vitest';
import type { FocusInfo } from '@earshot/contracts';
import { isSameElement } from '../../src/model/same-element.ts';

const focus = (extra: Partial<FocusInfo>): FocusInfo => ({
  role: 'combobox',
  name: 'To',
  states: {},
  isBody: false,
  isInsideComponent: true,
  ...extra,
});

describe('isSameElement', () => {
  it('is the same element when its number is the same, though a sibling left and its path changed', () => {
    const before = focus({ element: 3, path: 'div:nth-child(4) > input#to' });
    const after = focus({ element: 3, path: 'div:nth-child(3) > input#to' });
    expect(isSameElement(before, after)).toBe(true);
  });

  it('is another element when the number differs, though the path is the same', () => {
    const before = focus({ element: 3, path: 'input#to' });
    expect(isSameElement(before, focus({ element: 4, path: 'input#to' }))).toBe(false);
  });

  it('falls back to the path, then to role and name, for recordings without a number', () => {
    expect(isSameElement(focus({ path: 'a' }), focus({ path: 'a' }))).toBe(true);
    expect(isSameElement(focus({ path: 'a' }), focus({ path: 'b' }))).toBe(false);
    expect(isSameElement(focus({}), focus({ name: 'Subject' }))).toBe(false);
  });
});
