import type { Requirement } from '../schema/index.ts';
import { apg, wcag } from './tabs-sources.ts';

/**
 * What accessibility asks of the design of tabs, proposed on 2026-11-19 and approved
 * that day with the levels below. Each reason follows the cited page as it stands in
 * docs/sources/: `wcag` only where the page states the requirement itself.
 * - Use of Color: "Color is not used as the only visual means of conveying information".
 * - Non-text Contrast: "any visual information necessary to indicate state, such as whether a
 *   component is selected or focused must also ensure that the information used to identify the
 *   control in that state has a minimum 3:1 contrast ratio".
 * - Focus Visible: "Any keyboard operable user interface has a mode of operation where the
 *   keyboard focus indicator is visible."
 * - APG keyboard practice: "The selected state must be visually distinct from the focus
 *   indicator."
 * - APG keyboard practice, on focus indicators: "Colors and gradients can disappear in high
 *   contrast modes."
 * - APG tabs examples: borders and a separate focus ring "To ensure people who rely on browser or
 *   operating system high contrast settings can both distinguish the active (selected) tab from
 *   other tabs and perceive keyboard focus".
 */
export const tabsRequirements: Requirement[] = [
  {
    id: 'selected-tab-marked',
    // The 3:1 is the marker against what is next to it, not one state against another. 1.4.11:
    // "This success criterion does not require that changes in color that differentiate between
    // states of an individual component meet the 3:1 contrast ratio when they do not appear next
    // to each other." (Review note, 2026-11-19: the old title could be read as 3:1 between the
    // selected and an unselected tab.)
    title:
      'The selected tab’s marker reaches 3:1 against what is next to it, and is not colour alone',
    reason:
      'The selected tab says which panel is shown. A mark that is not text, such as a bar or a border, needs 3:1 against the colours next to it in every theme. And colour alone is not enough: a selected tab that differs only in hue is lost to people who do not see that hue, while a bar, a border or a heavier weight is not.',
    level: 'wcag',
    sources: [
      wcag('1.4.11', 'Non-text Contrast', 'non-text-contrast'),
      wcag('1.4.1', 'Use of Color', 'use-of-color'),
    ],
  },
  {
    id: 'tab-focus-visible',
    title: 'Show focus on the tabs and on the panel, at 3:1',
    reason:
      'The arrow keys move focus from tab to tab, and Tab moves it on to the panel when the panel is a Tab stop. Each needs a focus indicator a person can see, at 3:1 against the colours next to it in every theme.',
    level: 'wcag',
    sources: [
      wcag('2.4.7', 'Focus Visible', 'focus-visible'),
      wcag('1.4.11', 'Non-text Contrast', 'non-text-contrast'),
    ],
  },
  {
    id: 'focus-distinct-from-selected',
    title: 'Selected and focused look different',
    reason:
      'Where the arrow keys do not activate, the tab with focus and the selected tab are two different tabs, and a person needs to see both: which panel is shown, and where Enter will act. Where they do activate, the two are one tab most of the time, and the difference still tells a person that focus is on the tab list at all.',
    level: 'guidance',
    sources: [apg.focusVsSelection],
  },
  {
    id: 'forced-colors',
    title: 'The selected tab and focus stay visible in forced colours',
    reason:
      'Colours and gradients can disappear in high contrast modes, so a selected tab marked by a fill alone can look like the others. Mark the selected tab with a border, as the APG example does, and keep the focus ring apart from that border, so a person can still tell the selected tab from the others and see where focus is.',
    level: 'guidance',
    sources: [
      {
        ...apg.automaticExample,
        note: 'The example’s accessibility features: borders on the selected tab and a focus ring on a separate element.',
      },
      {
        ...apg.focusVisible,
        note: 'The considerations for overriding the default focus indicator: “Colors and gradients can disappear in high contrast modes.”',
      },
    ],
  },
];
