/**
 * Every requirement that has a drawing in "For design", by id. The drawings are typed against this
 * list (requirement-visual.tsx), so an id here without a drawing fails the build, and
 * test/unit/requirement-drawings.test.ts fails when a published pattern has a requirement that is
 * not here. Tabs and the modal dialog shipped with none and nothing noticed (2026-11-25).
 */
export const drawnRequirementIds = [
  // Input with chips
  'focus-ring',
  'remove-target',
  'chip-contrast',
  'invalid-in-text',
  'label-and-hint',
  'max-height',
  'read-only-over-disabled',
  // Combobox
  'active-option-drawn',
  'active-option-contrast',
  'option-contrast',
  'option-target',
  'visible-label',
  'field-boundary',
  // Menu button
  'item-focus-visible',
  'item-contrast',
  'item-target',
  'focused-item-in-view',
  'focused-item-on-screen',
  // Tabs
  'selected-tab-marked',
  'tab-focus-visible',
  'focus-distinct-from-selected',
  'forced-colors',
  // Modal dialog
  'visible-title',
  'visible-close',
  'page-behind-dimmed',
  'dialog-focus-visible',
  'initial-focus-decided',
  'close-target',
  // Select: the rest it shares with the combobox, drawn as a select (select-visual.tsx)
  'native-select-first',
] as const;

export type DrawnRequirementId = (typeof drawnRequirementIds)[number];
