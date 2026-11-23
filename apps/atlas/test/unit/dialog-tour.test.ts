import { describe, expect, it } from 'vitest';
import {
  dialogRulesLitBy,
  initialDialogTour,
  observeDialogKey,
  type DialogSnapshot,
} from '../../src/features/playground/dialog-tour';

const closed: DialogSnapshot = { isOpen: false, onOpener: true, focused: null, count: 3 };
const at = (focused: number | null): DialogSnapshot => ({
  isOpen: true,
  onOpener: false,
  focused,
  count: 3,
});
const press = (key: string, before: DialogSnapshot, after: DialogSnapshot) =>
  observeDialogKey(initialDialogTour, { key, before, after }).done;

describe('the dialog tour', () => {
  it('counts opening only when focus moved into the dialog', () => {
    expect(press('Enter', closed, at(1))).toEqual(['open-focus']);
    // Opened, and focus on the dialog itself or still on the button: not what the step asks.
    expect(press('Enter', closed, at(null))).toEqual([]);
    expect(press('Enter', closed, closed)).toEqual([]);
  });

  it('counts a wrap at either end, and not a Tab in the middle', () => {
    expect(press('Tab', at(3), at(1))).toEqual(['wrap']);
    expect(press('Shift+Tab', at(1), at(3))).toEqual(['wrap']);
    expect(press('Tab', at(1), at(2))).toEqual([]);
  });

  it('counts Escape only when the dialog closed and focus is back on the button', () => {
    expect(press('Escape', at(2), closed)).toEqual(['return-focus']);
    expect(press('Escape', at(2), { ...closed, onOpener: false })).toEqual([]);
    expect(press('Escape', at(2), at(2))).toEqual([]);
  });

  it('lights the rules a key exercises where it is pressed', () => {
    expect(dialogRulesLitBy('Enter', closed)).toEqual(['open-focus']);
    expect(dialogRulesLitBy('Tab', at(2))).toEqual(['contained', 'wrap']);
    expect(dialogRulesLitBy('Escape', at(2))).toEqual(['escape', 'return-focus']);
    expect(dialogRulesLitBy('Tab', closed)).toEqual([]);
  });
});
