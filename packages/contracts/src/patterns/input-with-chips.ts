import { Pattern } from '../schema/index.ts';
import { inputWithChipsRules } from './input-with-chips-rules.ts';
import { apg, wcag } from './input-with-chips-sources.ts';
import { inputWithChipsTradeOffs } from './input-with-chips-trade-offs.ts';

export const inputWithChips = Pattern.parse({
  id: 'input-with-chips',
  name: 'Input with chips',
  aliases: ['Tag input', 'Token field', 'People picker', 'Multi-select'],
  description:
    'A text input that turns entered values into removable chips you can reach and remove from the keyboard.',
  apg: {
    dedicated: false,
    note: 'There is no dedicated APG pattern. The reference combines an APG combobox for typing and suggestions with a list of remove buttons that use roving focus. Chips are deliberately not listbox options, because an option cannot contain an interactive button.',
    builtOn: [apg.combobox, apg.rovingTabindex],
  },
  rules: inputWithChipsRules,
  requirements: [
    {
      id: 'focus-ring',
      title: 'Focus ring on every chip',
      reason:
        'Arrow keys move focus between chips. Without a visible ring with enough contrast, keyboard users lose their place.',
      level: 'wcag',
      sources: [
        wcag('2.4.7', 'Focus Visible', 'focus-visible'),
        wcag('1.4.11', 'Non-text Contrast', 'non-text-contrast'),
      ],
    },
    {
      id: 'remove-target',
      title: 'Remove target at least 24 by 24 px',
      reason: 'A small remove icon is hard to hit with a mouse or a finger.',
      level: 'wcag',
      sources: [wcag('2.5.8', 'Target Size (Minimum)', 'target-size-minimum')],
    },
    {
      id: 'chip-contrast',
      title: 'Chip text at least 4.5:1 in every theme',
      reason:
        'Chips sit on a tinted background, which is where contrast usually breaks, often only in dark mode.',
      level: 'wcag',
      sources: [wcag('1.4.3', 'Contrast (Minimum)', 'contrast-minimum')],
    },
    {
      id: 'invalid-in-text',
      title: 'Invalid chips explained in text, not colour only',
      reason:
        'A red chip alone does not tell a colour-blind or screen reader user what is wrong or how to fix it.',
      level: 'wcag',
      sources: [
        wcag('1.4.1', 'Use of Color', 'use-of-color'),
        wcag('3.3.1', 'Error Identification', 'error-identification'),
      ],
    },
    {
      id: 'label-and-hint',
      title: 'Visible label and keyboard hint',
      reason:
        'Backspace and arrow behaviour is not discoverable. A short hint tells everyone how the field works.',
      level: 'wcag',
      sources: [wcag('3.3.2', 'Labels or Instructions', 'labels-or-instructions')],
    },
    {
      id: 'max-height',
      title: 'Grow to a maximum height, then scroll',
      reason:
        'A field that grows without limit pushes content away and can hide the focused chip under sticky interface parts.',
      level: 'wcag',
      sources: [wcag('2.4.11', 'Focus Not Obscured (Minimum)', 'focus-not-obscured-minimum')],
    },
    {
      id: 'read-only-over-disabled',
      title: 'Prefer read-only over disabled',
      reason:
        'A disabled field usually leaves the tab order and is exempt from contrast requirements, so people cannot review what was selected. Read-only keeps the chips reachable and readable.',
      level: 'guidance',
      sources: [apg.disabledControls],
    },
  ],
  tradeOffs: inputWithChipsTradeOffs,
});
