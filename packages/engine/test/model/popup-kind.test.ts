import { describe, expect, it } from 'vitest';
import { popupKindOf } from '../../src/model/popup-kind.ts';

describe('popupKindOf', () => {
  it('reads the kind the attribute names, and a menu for "true"', () => {
    expect(popupKindOf('menu', 'button')).toBe('menu');
    expect(popupKindOf('listbox', 'button')).toBe('listbox');
    expect(popupKindOf('true', 'button')).toBe('menu');
  });

  it('is nothing for an absent, false, empty or unknown value', () => {
    expect(popupKindOf(null, 'button')).toBeUndefined();
    expect(popupKindOf('false', 'button')).toBeUndefined();
    expect(popupKindOf('', 'button')).toBeUndefined();
    expect(popupKindOf('popover', 'button')).toBeUndefined();
  });

  it('is nothing when the attribute only repeats the default of the role', () => {
    expect(popupKindOf('listbox', 'combobox')).toBeUndefined();
  });

  it('is said for a combobox whose popup is not a listbox', () => {
    expect(popupKindOf('dialog', 'combobox')).toBe('dialog');
    expect(popupKindOf('grid', 'combobox')).toBe('grid');
    // "true" means a menu, which is not what a combobox has by default.
    expect(popupKindOf('true', 'combobox')).toBe('menu');
  });
});
