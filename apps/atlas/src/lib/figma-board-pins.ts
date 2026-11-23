/*
 * Where each requirement's numbered pin sits on the pattern's drawing for Figma: the layer it is
 * about, by the name the drawing gives it, and the side of that layer. Kept by requirement id, so
 * a requirement added or removed in contracts fails the board instead of leaving a note without
 * a place, or a pin without a note.
 */

/** `top`: above the layer's middle; `after`: past its end; `right`: on its right edge; `corner`: its upper right corner. */
export type PinPlace = 'top' | 'after' | 'right' | 'corner';

export interface Pin {
  layer: string;
  place: PinPlace;
  /** For `top`: the container whose upper edge the pin sits on, so it clears the layers inside. */
  edgeOf?: string;
}

export type Pins = Readonly<Record<string, Pin>>;

const inputWithChips: Pins = {
  'focus-ring': { layer: 'Chip / focused', place: 'top', edgeOf: 'Field' },
  'remove-target': { layer: 'Remove button', place: 'top', edgeOf: 'Field' },
  'chip-contrast': { layer: 'Chip text', place: 'top', edgeOf: 'Field' },
  'invalid-in-text': { layer: 'Error text', place: 'after' },
  'label-and-hint': { layer: 'Keyboard hint', place: 'after' },
  'max-height': { layer: 'Field', place: 'right' },
  'read-only-over-disabled': { layer: 'Input with chips', place: 'corner' },
};

const combobox: Pins = {
  'active-option-drawn': { layer: 'Option / active', place: 'top' },
  'active-option-contrast': { layer: 'Option / active', place: 'right' },
  'option-contrast': { layer: 'Option text / active', place: 'after' },
  'option-target': { layer: 'Option / rest', place: 'right' },
  'visible-label': { layer: 'Label', place: 'after' },
  'field-boundary': { layer: 'Field', place: 'right' },
};

const menuButton: Pins = {
  'item-focus-visible': { layer: 'Item / Duplicate, focused', place: 'right' },
  'item-contrast': { layer: 'Item text / focused', place: 'after' },
  'item-target': { layer: 'Item / Delete', place: 'right' },
  'focused-item-in-view': { layer: 'Menu', place: 'corner' },
  'focused-item-on-screen': { layer: 'Menu', place: 'top' },
};

const tabs: Pins = {
  'selected-tab-marked': { layer: 'Tab / selected', place: 'top', edgeOf: 'Tab list' },
  'tab-focus-visible': { layer: 'Tab / focused', place: 'top', edgeOf: 'Tab list' },
  'focus-distinct-from-selected': { layer: 'Tab list', place: 'after' },
  'forced-colors': { layer: 'Tabs', place: 'corner' },
};

const dialog: Pins = {
  'visible-title': { layer: 'Title', place: 'after' },
  'visible-close': { layer: 'Close button', place: 'top', edgeOf: 'Dialog' },
  'page-behind-dimmed': { layer: 'Modal dialog', place: 'corner' },
  'dialog-focus-visible': { layer: 'Button / focused', place: 'top' },
  'initial-focus-decided': { layer: 'Dialog', place: 'right' },
  // Past the button, not on its edge: there the pin covered half of a 24 px target.
  'close-target': { layer: 'Close button', place: 'after' },
};

/** The patterns that have a drawing, by pattern id. */
export const boardPins: Readonly<Record<string, Pins>> = {
  'input-with-chips': inputWithChips,
  combobox,
  'menu-button': menuButton,
  tabs,
  dialog,
};
