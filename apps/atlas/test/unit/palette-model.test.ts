import { describe, expect, it } from 'vitest';
import {
  filterItems,
  firstEnabled,
  moveActive,
  type PaletteItem,
} from '../../src/ui/command-palette/palette-model';

const item = (label: string, extra: Partial<PaletteItem> = {}): PaletteItem => ({
  id: label.toLowerCase().replaceAll(' ', '-'),
  label,
  href: `/${label}`,
  ...extra,
});

const chips = item('Input with chips', { keywords: ['Tag input', 'Token field'] });
const combobox = item('Combobox', { isDisabled: true });
const menu = item('Menu button', { isDisabled: true });
const all = [chips, combobox, menu];

describe('filterItems', () => {
  it('lists everything for an empty or blank query', () => {
    expect(filterItems(all, '  ')).toEqual(all);
  });

  it('matches the label and keywords, ignoring case', () => {
    expect(filterItems(all, 'CHIPS')).toEqual([chips]);
    expect(filterItems(all, 'token')).toEqual([chips]);
  });

  it('returns nothing when no item matches', () => {
    expect(filterItems(all, 'carousel')).toEqual([]);
  });
});

describe('moveActive', () => {
  const enabled = [chips, item('Disclosure'), combobox, item('Tabs')];

  it('moves down and up, wrapping at the ends', () => {
    expect(moveActive(0, 'ArrowDown', enabled)).toBe(1);
    expect(moveActive(3, 'ArrowDown', enabled)).toBe(0);
    expect(moveActive(0, 'ArrowUp', enabled)).toBe(3);
  });

  it('skips disabled options', () => {
    expect(moveActive(1, 'ArrowDown', enabled)).toBe(3);
    expect(moveActive(3, 'ArrowUp', enabled)).toBe(1);
  });

  it('starts at the first or last option when nothing is active', () => {
    expect(moveActive(undefined, 'ArrowDown', enabled)).toBe(0);
    expect(moveActive(undefined, 'ArrowUp', enabled)).toBe(3);
  });

  it('leaves caret keys to the input', () => {
    expect(moveActive(0, 'Home', enabled)).toBeUndefined();
    expect(moveActive(0, 'ArrowLeft', enabled)).toBeUndefined();
  });

  it('has nowhere to go when every option is disabled', () => {
    expect(moveActive(undefined, 'ArrowDown', [combobox, menu])).toBeUndefined();
    expect(firstEnabled([combobox, menu])).toBeUndefined();
  });
});
