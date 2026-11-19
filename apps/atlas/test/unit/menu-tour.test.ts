import { describe, expect, it } from 'vitest';
import {
  initialMenuTour,
  menuRulesLitBy,
  observeMenuKey,
  type MenuSnapshot,
} from '../../src/features/playground/menu-tour';

const none = 'Last action: none';
const closed = (lastAction = none): MenuSnapshot => ({
  focusOnButton: true,
  isOpen: false,
  active: null,
  activeIsDisabled: false,
  lastAction,
});
const on = (active: string, activeIsDisabled = false): MenuSnapshot => ({
  focusOnButton: false,
  isOpen: true,
  active,
  activeIsDisabled,
  lastAction: none,
});

const press = (keys: readonly [string, MenuSnapshot, MenuSnapshot][]) =>
  keys.reduce(
    (state, [key, before, after]) => observeMenuKey(state, { key, before, after }),
    initialMenuTour,
  );

describe('the menu button tour', () => {
  it('completes “open” when Enter on the button opens the menu on an item', () => {
    expect(press([['Enter', closed(), on('Rename')]]).done).toEqual(['open']);
  });

  it('does not complete “open” when the menu opens with no item active', () => {
    const opened = { ...on('Rename'), active: null };
    expect(press([['Enter', closed(), opened]]).done).toEqual([]);
  });

  it('completes “arrows” only after a move down and a move back up', () => {
    const down: [string, MenuSnapshot, MenuSnapshot] = ['ArrowDown', on('Rename'), on('Duplicate')];
    expect(press([down]).done).toEqual([]);
    expect(press([down, ['ArrowUp', on('Duplicate'), on('Rename')]]).done).toEqual(['arrows']);
  });

  it('completes “activate” when the page says the item’s action ran and the menu closed', () => {
    const ran = closed('Last action: Duplicate');
    expect(press([['Enter', on('Duplicate'), ran]]).done).toEqual(['activate']);
  });

  it('does not complete “activate” on a disabled item, where nothing runs', () => {
    expect(press([['Enter', on('Archive', true), on('Archive', true)]]).done).toEqual([]);
  });

  it('completes “escape” when the menu closes with focus back on the button', () => {
    expect(press([['Escape', on('Duplicate'), closed()]]).done).toEqual(['escape']);
    const lost = { ...closed(), focusOnButton: false };
    expect(press([['Escape', on('Duplicate'), lost]]).done).toEqual([]);
  });
});

describe('menuRulesLitBy', () => {
  it('lights the rule a key exercises where it is pressed', () => {
    expect(menuRulesLitBy('Enter', closed())).toEqual(['open']);
    expect(menuRulesLitBy('ArrowDown', on('Rename'))).toEqual(['arrows']);
    expect(menuRulesLitBy('Escape', on('Rename'))).toEqual(['escape']);
    expect(menuRulesLitBy('Enter', on('Duplicate'))).toEqual(['activate']);
  });

  it('lights nothing for Enter on a disabled item or for arrows on a closed button', () => {
    expect(menuRulesLitBy('Enter', on('Archive', true))).toEqual([]);
    expect(menuRulesLitBy('ArrowLeft', closed())).toEqual([]);
  });
});
