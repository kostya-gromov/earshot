import type { Rule } from '../schema/index.ts';
import { apg, wcag } from './tabs-sources.ts';

/**
 * The rules and the Earshot recommendation for a horizontal tab list with one panel shown at a
 * time (docs/proposals/tabs.md, approved 2026-11-19). Three terms have one meaning in every rule:
 *
 * - **Focused tab**: the tab that holds DOM focus, or the tab a focused tab list names with
 *   aria-activedescendant. The APG page names neither mechanism; which one a system uses is
 *   recorded and shown, never judged.
 * - **Active tab**: the one tab exposed as selected. To activate a tab is to make it the active one
 *   and show its panel. Where no tab or more than one is selected there is no active tab: that is
 *   charged to `selected` alone, and the rules that judge against the active tab do not judge
 *   that moment (verdict audit 2026-11-19).
 * - **Shown panel**: an element with role tabpanel that is in the accessibility tree.
 *
 * One defect, one rule: a selected state that is wrong belongs to `selected`; a panel that does
 * not match the selection belongs to `panel`; `activate` asks only that something moved to the
 * focused tab, the selection or the panel; arrow keys that do nothing belong to `arrows`, not
 * `wrap`; focus that falls to the document belongs to `tab-out`, not `panel-reachable`. One
 * exception, on purpose: a tab list where every tab is a Tab stop differs on `tab-in` and on
 * `tab-out`, because APG asks for the two separately and a system can fail one without the other
 * (verdict audit 2026-11-19, second round; decided by the owner the same day).
 *
 * Whether the arrow keys also activate the tab they move to is recorded, not judged: APG makes
 * it optional ("Optionally, activates the newly focused tab"), and its advice turns on how fast
 * a panel appears, which a page with every panel already loaded does not show.
 */
export const tabsRules: Rule[] = [
  {
    id: 'tab-in',
    title: 'Tab into the list lands on the active tab',
    description:
      'Tab from the control before the tab list puts focus on the tab that was active before the key, also when it is not the first one; Shift+Tab from after the tabs comes back to it too. Differs when focus lands on another tab, even if that tab then becomes the active one, or when Tab skips the tab list. Not judged where no single tab was active before the key, or where four presses of Shift+Tab did not reach the tab list.',
    keys: ['Tab', 'Shift+Tab'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'tab-out',
    title: 'The tab list is one Tab stop',
    description:
      'With focus on a tab, Tab moves focus out of the tab list. Differs when focus stays on the tab, lands on another tab, or falls to the document. Where focus lands once it left is the question of “Tab reaches the shown panel”.',
    keys: ['Tab'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'panel-reachable',
    title: 'Tab reaches the shown panel',
    description:
      'Tab from the tab list lands on the shown panel. Where the panel’s first content is something that takes focus, such as a link, landing on that element follows as well. On every measured page that link is the only element in the panel that takes focus, so landing inside the panel means one of the two. Differs when focus lands past the panel, on the next control of the page, so that a keyboard or screen reader user has to search for the content the tab just showed, or anywhere else outside the shown panel. Judged only after focus left the tab list for an element; focus that falls to the document is charged to “The tab list is one Tab stop” and not judged here.',
    keys: ['Tab'],
    level: 'rule',
    sources: [
      { ...apg.keyboard, note: 'The keyboard section for Tab, and its note on tabindex="0".' },
      {
        ...apg.automaticExample,
        note: 'The example gives every panel tabindex="0" and says why.',
      },
    ],
  },
  {
    id: 'arrows',
    title: 'Arrow keys move between the tabs',
    description:
      'Right Arrow moves focus to the next tab and Left Arrow to the previous one. Judged between neighbours; what happens at either end is the next rule. Whether the tab that receives focus is also activated is recorded, not judged.',
    keys: ['ArrowRight', 'ArrowLeft'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'wrap',
    title: 'Arrow keys wrap at the ends',
    description:
      'Right Arrow on the last tab moves focus to the first, and Left Arrow on the first tab to the last. Unlike the menu, APG does not make wrapping optional for tabs. Differs when focus stays at the end or leaves the tab list. Not judged where the arrow keys move focus nowhere at all, not even between neighbours: that is “Arrow keys move between the tabs”.',
    keys: ['ArrowRight', 'ArrowLeft'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'activate',
    title: 'Enter and Space activate the focused tab',
    description:
      'Where the arrow keys move focus without activating the tab, Enter on the focused tab activates it, and Space does the same. Where the arrow keys already activate the tab, not applicable: there is nothing left for Enter or Space to do. Judged only where, before the key, focus was on a tab other than the single active one; where the arrow key did not get it there, that is the question of “Arrow keys move between the tabs”. Differs when neither the selection nor the shown panel moved to the focused tab; when only one of them moved, the mismatch is the question of “One panel is shown, named by its tab”.',
    keys: ['Enter', 'Space'],
    level: 'rule',
    sources: [
      apg.keyboard,
      { ...apg.manualExample, note: 'The keyboard table for Enter and Space.' },
      {
        ...apg.selectionFollowsFocus,
        relation: 'related',
        note: 'Related: when to activate on focus and when to wait for Enter or Space, and what each costs.',
      },
    ],
  },
  {
    id: 'selected',
    title: 'Exactly one tab is selected',
    description:
      'After every step, exactly one tab is exposed as selected and every other tab is exposed as not selected. Differs when no tab or more than one tab is selected, or when the accessibility tree gives a tab no selected state at all: APG asks for false on the others, and no state is not false. (Chromium gives none where aria-selected is missing, and does not infer one from focus.)',
    keys: ['ArrowRight', 'Enter'],
    level: 'rule',
    sources: [
      apg.roles,
      {
        ...wcag('4.1.2', 'Name, Role, Value', 'name-role-value'),
        relation: 'related',
        note: 'Related: 4.1.2 asks that states which the user can set can be programmatically set, and that changes to them are notified to assistive technologies; that the state is aria-selected on each tab comes from the APG pattern above.',
      },
    ],
  },
  {
    id: 'panel',
    title: 'One panel is shown, named by its tab',
    description:
      'After every step, exactly one tab panel is in the accessibility tree, and its accessible name is the name of the active tab. Differs when two panels are exposed at once, when none is, or when the shown panel is named by another tab or not named, which leaves a screen reader user who enters it without its title. Where no single tab is active, which is charged to “Exactly one tab is selected”, the one shown panel need only be named by one of the tabs exposed as selected, or by any tab when none is.',
    keys: ['ArrowRight', 'Enter'],
    level: 'rule',
    sources: [apg.about, apg.roles],
  },
  {
    id: 'vertical-keys-free',
    title: 'Up and Down Arrow are left to the page',
    description:
      'In a horizontal tab list, Down Arrow and Up Arrow move neither focus nor selection. An Earshot recommendation: APG gives it as a note, so that “those keys can provide their normal browser scrolling functions even when focus is inside the tab list”. The engine judges what it can see, that focus and selection stay where they were; whether the page scrolled is not recorded.',
    keys: ['ArrowDown', 'ArrowUp'],
    level: 'recommendation',
    sources: [apg.keyboard],
  },
];
