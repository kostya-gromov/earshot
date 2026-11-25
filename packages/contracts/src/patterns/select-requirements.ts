import type { Requirement } from '../schema/index.ts';
import { apg, wcag } from './select-sources.ts';

/**
 * What accessibility asks of the design of a select. native-select-first was approved
 * on 2026-11-25 (O3), after two changes in review: the tree, not screen readers, and the
 * customizable select from dated sources. The other six were approved on the preview page
 * on 2026-11-25, field-boundary after a check against the 1.4.11 snapshot ("While not normatively
 * required, authors are still encouraged to delineate the boundary of all controls"). The source, from the select-only example: "Robust accessibility can be further
 * optimized by choosing implementation patterns that maximize use of semantic HTML and heeding
 * the warning that No ARIA is better than Bad ARIA." And, for the other side: "the following
 * differences in behavior are implemented to improve both accessibility and general usability."
 * Its look, from MDN and the Chrome blog (snapshots of 2026-11-25): base-select from Chrome 135;
 * that it keeps the keyboard is not stated there, so not claimed. Firefox and Safari are left to
 * "browsers without it": caniuse changed between versions and is not a dated source. The typed letter is measured (the measurement file
 * native-select.json of the select, engine 0.23.0, Chromium on macOS); the reference select,
 * measured the same day, opens its list on the same letter. Other systems are not measured, so
 * nothing is claimed for them.
 *
 * The other six follow the combobox's (combobox-requirements.ts, verdict audit of 2026-11-15),
 * kept to what applies to a select, as asked on 2026-11-24 (O3). `wcag` only where the page states the requirement itself. That
 * the reference select meets each is not measured yet.
 */
export const selectRequirements: Requirement[] = [
  {
    id: 'native-select-first',
    title: 'Use the browser’s own select unless it cannot do what the list needs',
    reason:
      'The browser’s select brings its keyboard, typing to jump to an option, and its name and value in the accessibility tree, with no script of your own. A custom select has to build all of that and keep it working. Its keys are the browser’s, not the ones the APG example chose. Measured in Chromium on macOS: a letter typed on the closed select chose “Cherry” and left the list closed, where the APG example opens the list. Its look need not be the browser’s: from Chrome 135, appearance: base-select lets the button, the list and the options be styled, and options can hold more than text, such as images, while it stays a select element. MDN calls it an experimental browser feature. What the select’s button is given to show can change the value exposed in the accessibility tree, so check it. Where base-select is not supported, the select falls back to the classic one, in the browser’s look. Build a custom select when you need what a customizable select cannot give, or that look in browsers without it, and measure it.',
    level: 'guidance',
    sources: [
      {
        ...apg.example,
        relation: 'rationale',
        note: 'Cited as rationale: it advises making the most of semantic HTML.',
      },
      {
        ...apg.chromeCustomizableSelect,
        relation: 'related',
        note: 'Related: a styleable select, from Chrome 135.',
      },
      {
        ...apg.mdnCustomizableSelect,
        relation: 'related',
        note: 'Related: what can be styled, the value in the tree, and the fallback.',
      },
    ],
  },
  {
    id: 'active-option-drawn',
    title: 'Draw the active option as focused',
    reason:
      'DOM focus stays on the select while arrow keys move through the list, so the browser draws its focus ring on the select and nothing on the option. APG asks the design to draw a focus indicator on the active option, and to keep that option scrolled into view in a list that scrolls.',
    level: 'guidance',
    sources: [apg.activeDescendant, wcag('2.4.7', 'Focus Visible', 'focus-visible')],
  },
  {
    id: 'active-option-contrast',
    title: 'Active option marked at 3:1, not by a faint tint',
    reason:
      'A faint change of background may be missed completely by people with low vision. Whatever marks the active option needs 3:1 against the colours next to it, in every theme: a fill that reaches 3:1 against the list, or an outline or a bar added to a tint that does not. A check mark on the chosen option is a second mark and needs the same.',
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
    title: 'A label or prompt that stays available',
    reason:
      'When a label or a prompt is what tells people what the select is for, WCAG asks that it stay available. A prompt such as “Choose…” that the chosen option replaces is gone from then on, so the cue has to be somewhere that stays, most often a text label beside the field. The page names one exception: where the options themselves make the purpose clear, a select-only combobox may need no visible label, and in a toolbar its label may be shown on hover or focus.',
    level: 'wcag',
    sources: [wcag('3.3.2', 'Labels or Instructions', 'labels-or-instructions')],
  },
  {
    id: 'field-boundary',
    title: 'A field boundary people can see, at 3:1',
    reason:
      'WCAG requires a boundary at 3:1 only when nothing else shows the control is there, and encourages it otherwise. A select drawn as its value and a chevron alone can read as text; its border or fill is usually what people find it by.',
    level: 'guidance',
    sources: [wcag('1.4.11', 'Non-text Contrast', 'non-text-contrast')],
  },
];
