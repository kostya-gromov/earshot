import type { Requirement } from '../schema/index.ts';
import { apg, wcag } from './combobox-sources.ts';

/**
 * What accessibility asks of the design of a combobox. Each reason follows the cited page as it
 * stands in docs/sources/ (snapshots of 2026-11-15). `wcag` is used only where the page states
 * the requirement itself; what APG advises or WCAG only encourages is `guidance` (verdict audit
 * of 2026-11-15). The reference meets every one; its list of six never scrolls, so it does not
 * show the scrolling part of the first.
 */
export const comboboxRequirements: Requirement[] = [
  {
    id: 'active-option-drawn',
    title: 'Draw the active option as focused',
    reason:
      'DOM focus stays in the input while arrow keys move through the list, so the browser draws its focus ring on the input and nothing on the option. APG asks the design to draw a focus indicator on the active option, and to keep that option scrolled into view in a list that scrolls.',
    level: 'guidance',
    sources: [apg.activeDescendant, wcag('2.4.7', 'Focus Visible', 'focus-visible')],
  },
  {
    id: 'active-option-contrast',
    title: 'Active option marked at 3:1, not by a faint tint',
    reason:
      'A faint change of background may be missed completely by people with low vision. Whatever marks the active option needs 3:1 against the colours next to it, in every theme: a fill that reaches 3:1 against the list, or an outline or a bar added to a tint that does not.',
    level: 'wcag',
    sources: [
      wcag('1.4.1', 'Use of Color', 'use-of-color'),
      wcag('1.4.11', 'Non-text Contrast', 'non-text-contrast'),
    ],
  },
  {
    id: 'option-contrast',
    title: 'Option text at least 4.5:1, also on the active option',
    reason:
      'The active option changes its background. Text that passes on the plain list can fail on the highlight, often in one theme only. Disabled options are exempt.',
    level: 'wcag',
    sources: [wcag('1.4.3', 'Contrast (Minimum)', 'contrast-minimum')],
  },
  {
    id: 'option-target',
    title: 'Options at least 24 px tall',
    reason:
      'Options are also chosen with a mouse or a finger. In a dense list with rows under 24 px, the neighbouring option is easy to hit instead.',
    level: 'wcag',
    sources: [wcag('2.5.8', 'Target Size (Minimum)', 'target-size-minimum')],
  },
  {
    id: 'visible-label',
    title: 'A label that stays, not a placeholder alone',
    reason:
      'A placeholder is gone after the first character, which is exactly when the suggestions appear. The cue to what the field is for has to stay available, most often as a text label; for a search field its icon can be that cue.',
    level: 'wcag',
    sources: [wcag('3.3.2', 'Labels or Instructions', 'labels-or-instructions')],
  },
  {
    id: 'field-boundary',
    title: 'A field boundary people can see, at 3:1',
    reason:
      'WCAG requires a boundary at 3:1 only when nothing else shows the control is there, and encourages it otherwise. A combobox looks like a text field, so its border, underline or fill is usually what people find it by.',
    level: 'guidance',
    sources: [wcag('1.4.11', 'Non-text Contrast', 'non-text-contrast')],
  },
];
