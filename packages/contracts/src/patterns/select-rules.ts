import type { Rule } from '../schema/index.ts';
import { apg, wcag } from './select-sources.ts';

const nameRoleValue = (note: string) => ({
  ...wcag('4.1.2', 'Name, Role, Value', 'name-role-value'),
  relation: 'related' as const,
  note,
});

/**
 * The rules and the Earshot recommendation for a select: APG's select-only combobox, with one
 * chosen value and no text input (docs/proposals/select.md, approved 2026-11-24). Ids shared with
 * the combobox name the same behavior; where each pattern's own APG example settles a detail
 * differently, the rule says so. `arrows` is judged as on the combobox: APG's pattern, one text
 * for both, names two outcomes at an end and does not rule out moving on (2026-11-24). Two
 * terms have one meaning in every rule:
 *
 * - **The select**: the element that holds focus while the list is closed. Its role, name and
 *   value are read from the accessibility tree.
 * - **Active option**: the option the select names with aria-activedescendant; or the option
 *   that holds DOM focus; or, when neither exists, the one option exposed as selected. Which of
 *   the three it was is charged once, by "Focus stays on the select".
 */
export const selectRules: Rule[] = [
  {
    id: 'tab',
    title: 'One Tab stop',
    description:
      'Tab from the field before puts focus on the select. With the list open, Tab never puts focus on the list or on an option. Whether that Tab also sets the value is recorded and not judged: the APG example does it; the pattern’s listbox keys do not list Tab. A select that had already moved DOM focus onto the list or an option is not judged here: that is charged to “Focus stays on the select”.',
    keys: ['Tab'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'name-and-value',
    title: 'A name, and the value apart from it',
    description:
      'The focused select is exposed with the role combobox, a name that is not empty, and a value, and the name does not contain the value. A screen reader then says what the field is and what is chosen as two things. A button that opens a list and carries the chosen option in its name differs: there is no value to read, and the name changes with every choice. Judged when the select takes focus and after Enter chooses an option. Which option’s text the value holds after Enter is judged by “Enter chooses the active option”, not here.',
    keys: ['Tab', 'Enter'],
    level: 'rule',
    sources: [
      apg.about,
      apg.roles,
      nameRoleValue(
        'Related: 4.1.2 asks that the name and role can be programmatically determined and that values the user can set can be programmatically set; that the name is distinct from the value comes from the APG pattern above.',
      ),
      {
        ...apg.namesAndDescriptions,
        relation: 'related',
        note: 'Related: descriptions “are presented last, sometimes after a slight delay”, and “some screen readers do not announce descriptions by default”; quoted where a select gives the chosen option only as a description.',
      },
    ],
  },
  {
    id: 'name-is-label',
    title: 'The name is the visible label',
    description:
      'The select’s name is its visible label and nothing more, apart from case and punctuation. An Earshot recommendation: APG asks that the name refer to the visible label and does not say “only”, and WCAG 2.5.3 asks that the name contain it. A name that is what is written beside the field is what a screen reader user hears and what a speech input user says. Not judged where the select is not exposed as a combobox, its name is empty, its name contains the value, or, with no value, its name is more than its label: those are charged to “A name, and the value apart from it”, one defect, one rule.',
    keys: ['Tab'],
    level: 'recommendation',
    sources: [
      {
        ...apg.roles,
        relation: 'rationale',
        note: 'Cited as rationale: with a visible label, APG asks that aria-labelledby refer to the labelling element; it does not say the name holds nothing else.',
      },
      {
        ...wcag('2.5.3', 'Label in Name', 'label-in-name'),
        relation: 'related',
        note: 'Related: 2.5.3 asks that the name contain the visible label, ignoring case and punctuation, and advises “Where practical, make the control’s text label and name match.”',
      },
    ],
  },
  {
    id: 'down',
    title: 'Down Arrow opens the list on an option',
    description:
      'Down Arrow on the closed select shows the list and makes an option active. Which option is recorded and not judged: the APG pattern says the first, its select-only example keeps the chosen one, and both are reasonable. A list that opens with no active option differs. A select that points at an option that does not exist is charged to “Focus stays on the select”, not here.',
    keys: ['ArrowDown'],
    level: 'rule',
    sources: [apg.keyboard, apg.example],
  },
  {
    id: 'expanded',
    title: 'Expanded says whether the list is shown',
    description:
      'The focused select is exposed as expanded while its options are in the accessibility tree, and as collapsed once they are gone. A listbox with no options is not judged: it may be a closed list kept in the page. Judged after every step in which the select holds focus; a step that takes focus elsewhere is not judged, because the rule is about the focused select.',
    keys: ['ArrowDown', 'Enter', 'Escape'],
    level: 'rule',
    sources: [
      apg.roles,
      nameRoleValue(
        'Related: 4.1.2 asks that states which the user can set can be programmatically set, and that changes to them are notified to assistive technologies; that the state is aria-expanded comes from the APG pattern above.',
      ),
    ],
  },
  {
    id: 'focus-stays',
    title: 'Focus stays on the select',
    description:
      'While arrow keys move through the options, DOM focus stays on the select, and the select names the active option with aria-activedescendant that points at an option in the list. Differs when DOM focus moves onto the list or its options; when an option is marked as selected but aria-activedescendant is not set; or when aria-activedescendant names something that is not an option, an element that does not exist included. Each of these differs here once; arrows, selection and Enter are still judged from the active option.',
    keys: ['ArrowDown', 'ArrowUp'],
    level: 'rule',
    sources: [apg.roles, apg.activeDescendant],
  },
  {
    id: 'arrows',
    title: 'Arrows move through the options',
    description:
      'Down Arrow makes the next option active and Up Arrow the previous one. At the last option Down Arrow does nothing, returns to the select, or moves on to the first option, and the same for Up Arrow at the first: the APG pattern names the first two and does not rule out the third, so all three follow. Which one a system takes is recorded. Judged only where an option became active; an end of the list that the keys never reached is not judged.',
    keys: ['ArrowDown', 'ArrowUp'],
    level: 'rule',
    sources: [apg.keyboard, apg.example],
  },
  {
    id: 'selected',
    title: 'The active option is the selected one',
    description:
      'The active option is exposed as selected, and no other option is: APG’s keyboard section says “Selection follows focus in the listbox”, and for Down Arrow “Moves focus to and selects the next option”. One sentence of its roles section can be read as allowing a second model: it puts aria-selected on the option “visually indicated as the currently selected value”, though a note in the same section says that a combobox is “a single-select widget where selection follows focus in the popup”. Read the first way, a list that keeps the chosen value marked, with a check mark and the selected state, while the active option is shown apart matches that sentence. That model differs here, and the difference is a choice between two readings of APG, not an error. Judged only where an option became active.',
    keys: ['ArrowDown', 'ArrowUp'],
    level: 'rule',
    sources: [
      apg.keyboard,
      apg.roles,
      apg.example,
      nameRoleValue(
        'Related: 4.1.2 asks that states which the user can set can be programmatically set; that the active option carries aria-selected comes from the APG pattern above.',
      ),
    ],
  },
  {
    id: 'enter',
    title: 'Enter chooses the active option',
    description:
      'Enter on an active option closes the list, the select’s value becomes that option’s text, and focus is on the select. Differs when the list stays open, when the value stays as it was, or when focus is elsewhere. Judged only where an option became active. Not judged where the select exposes no value: that is charged to “A name, and the value apart from it”.',
    keys: ['Enter'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'escape',
    title: 'Escape closes the list',
    description:
      'Escape with the list shown closes it, and focus is on the select. Judged only where the list was shown before the key. What happens to the value is judged by “Escape keeps the value”.',
    keys: ['Escape'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'escape-keeps-value',
    title: 'Escape keeps the value',
    description:
      'After the arrow keys move through the options and Escape closes the list, the select’s value is the one it had before the list opened. An Earshot recommendation: APG says comboboxes “can be implemented” so users explore the choices without losing the one they made, and its select-only example lists keeping the value among its own improvements; neither asks for it. A person can look through the options and leave with nothing changed. Judged only where another option became active before Escape. Not judged where the select exposes no value: that is charged to “A name, and the value apart from it”. The value is read from the select itself, so this is judged even where focus left the select on Escape.',
    keys: ['Escape'],
    level: 'recommendation',
    sources: [
      {
        ...apg.about,
        relation: 'rationale',
        note: 'Cited as rationale: the about section says comboboxes and menu buttons “can be implemented” so that Escape leaves the previous choice as it was, and contrasts that with a single-select listbox.',
      },
      {
        ...apg.example,
        relation: 'rationale',
        note: 'Cited as rationale: the select-only example keeps the value when the list is closed with Escape, and lists it among the differences it implements to improve accessibility and usability.',
      },
    ],
  },
];
