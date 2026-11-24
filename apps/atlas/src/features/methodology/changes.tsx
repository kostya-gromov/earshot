import { Fragment } from 'react';
import { Part } from './how-we-measure';

// From docs/decisions/0009 (dated history of the input-with-chips rules and counting), in the
// reader's words. Add an entry whenever a rule, a scenario, the counting or a verdict changes.
interface Change {
  date: string;
  /** One change. */
  text?: string;
  /** Several changes on one day, one per item, subject first. */
  items?: readonly string[];
}

const changes: readonly Change[] = [
  {
    date: '24 Nov 2026',
    text: 'Earshot Atlas is now called Earshot. Rules that used to say “An Atlas recommendation” now say “An Earshot recommendation”, and design requirements marked “Atlas guidance” now say “Earshot guidance”; what they ask is the same. The sample text on the tabs pages changed with the name, so the reference went to 0.1.9, and every reference and every tabs system was measured again on engine 0.20.0. No verdict and no reason changed.',
  },
  {
    date: '23 Nov 2026',
    text: 'Modal dialog, the fifth pattern, is on the site: ten rules, two of them Earshot recommendations, measured in six systems on engine 0.20.0 with reference 0.1.8. Five of the six follow all ten; one does not report its dialog as modal in the accessibility tree while it behaves as one. Two systems are measured as their documentation’s form example builds the dialog, with focus set on the first field, and the same dialog without that is shown beside them and not counted. A click on the page behind is recorded and drawn where it was made.',
  },
  {
    date: '23 Nov 2026',
    text: 'Engine 0.20.0 and reference 0.1.8. The semantic model no longer writes a spoken line for a step that ends with focus outside the page: it reads what focus lands on in the page’s tree, and there is nothing of the page to read there. Three tabs recordings (React Aria, Chakra UI, Fluent 2) held the line “…, document” for such a step. A click made at a point now records the point. The reference tabs wrap to a second row on a page 320 px wide, where they made the whole page scroll sideways. Every system and the reference measured again. No verdict and no reason changed, and each recording is the same as before, step for step, apart from timings and those two things.',
  },
  {
    date: '22 Nov 2026',
    text: 'A correction to how three tabs recordings are shown. In React Aria, Chakra UI and Fluent 2, the last Shift+Tab of “Shift+Tab back into the tabs” goes on past the first field of the page, out of the page. The site said “Focus lost to the page” for that step. It now says “Focus left the page” and marks the place with a sign of its own: Tab carried focus out, the page did not drop it. No verdict changed; that step is not what the rule judges.',
  },
  {
    date: '22 Nov 2026',
    text: 'Engine 0.19.1 and reference 0.1.7. Both change only the modal dialog, a fifth pattern that is being measured and is not on the site yet: before a click on the page behind an open dialog, the engine checks that the dialog itself does not cover the point, and the reference page keeps its fields clear of the dialog. Every system and the reference of the four patterns here measured again, so that all data is on one engine version. No verdict and no reason changed, and each recording is the same as before, step for step, apart from timings.',
  },
  {
    date: '21 Nov 2026',
    text: 'Engine 0.18.0 and reference 0.1.6. For the modal dialog, a fifth pattern that is being measured and is not on the site yet, the engine now records the dialog after each step, whether focus is inside it, and when focus has left the page for the browser’s own controls; a step is also held open while focus is still changing. Every system and the reference of the four patterns here measured again. No verdict and no reason changed, and each recording is the same as before, step for step, apart from timings and one new fact: in three tabs recordings (React Aria, Chakra UI, Fluent 2) the last Shift+Tab of “Shift+Tab back into the tabs” goes past the first field of the page, and that step now says focus left the page, where it used to read as focus on the document.',
  },
  {
    date: '19 Nov 2026',
    text: 'Tabs, the fourth pattern, is on the site: nine rules, measured in five systems on engine 0.17.0 with reference 0.1.5. Two systems, Fluent 2 and MUI, are measured as their documentation builds the panels, since neither package ships one. Whether a system activates a tab as it receives focus or on Enter and Space is shown, not judged: the standards allow both.',
  },
  {
    date: '19 Nov 2026',
    text: 'Engine 0.17.0 and reference 0.1.4. For tabs, the fourth pattern, the engine now records every tab and every shown panel after each step, and whether focus is inside the shown panel; tabs is being measured and is not on the site yet. Nothing changed in what the engine records for the three patterns here: every system and the reference of every pattern measured again, and each recording is the same as before, step for step, apart from timings. No verdict and no reason changed. Reference 0.1.5 the same day: in the tabs reference the focus ring now sits outside the tab, so it no longer covers the selected tab’s bar. Styles only; every reference measured again, each recording the same as before.',
  },
  {
    date: '17 Nov 2026',
    text: 'Engine 0.16.3 and 0.16.4, measured the same day. Under “The chips are one Tab stop” a scenario that follows now says what its own key did, “Tab leaves the chips” or “Shift+Tab leaves the chips”, where it used to say the rule’s name. React Aria showed why: its Shift+Tab leaves the chips and its Tab stops on a control inside one, so one row read “The chips are one Tab stop” under a verdict of Differs. A system whose two scenarios both follow is still described by the rule’s own words, “The chips are one Tab stop”. Every system and the reference of every pattern measured again, so all are on one engine. No verdict and no reason changed.',
  },
  {
    date: '17 Nov 2026',
    text: 'Two rules of input with chips are Earshot recommendations now, not rules from the standards: “Arrows move between chips” and “Keep focus in the field after a removal”. For the first, APG’s keyboard practice says arrow keys move focus inside a composite and leaves the choice of keys to the author, and in APG’s pill list Left and Right Arrow move through a recipient and its remove icon. For the second, APG calls it essential that focus is not lost to the page body when an item is deleted, and WCAG 2.4.3 is about the order of focus; that focus stays in the field is what Earshot adds. All five citations are marked as related. No verdict changed.',
  },
  {
    date: '16 Nov 2026',
    text: 'Menu button, the third pattern, is on the site: nine rules, measured in six systems on engine 0.16.2 with reference 0.1.3. One page of a system that differs from the one counted, Fluent 2’s Default story with a plain Button, is shown as a recording that is not counted.',
  },
  {
    date: '16 Nov 2026',
    text: 'Engine 0.16.1 and 0.16.2, measured the same day. A spoken line now says the popup an element has, as “has popup menu” (or listbox, tree, grid, dialog), when aria-haspopup on the focused element says more than its role already means; a combobox has a listbox by default, so that is not said. Whether focus moved is no longer read from where the element sits among its siblings: a field that kept focus while the page around it changed was read as focus arriving again, which added a line to Atlassian’s recordings that no other system had. And where a rule is judged on several steps of a scenario and counts them (the expanded state in combobox and menu button, the arrow keys in menu button), the file now records that count. Every system and the reference of every pattern measured again. No verdict changed. Reasons changed in wording only, in the rule about the expanded state of combobox and menu button: “after the 1 step judged” is now “after the one step judged”.',
  },
  {
    date: '16 Nov 2026',
    text: 'Engine 0.15.2 and reference 0.1.3, for a third pattern that is not on the site yet. The engine now also records whether focus is inside a popup, the element that opens it, and what a page says its last action was. Every system and the reference of both patterns measured again on it, so all are on one engine. No verdict and no reason changed. One change in what is heard: when focus lands on an element that already points at an active option, the option is now said after the element (combobox: Atlassian and React Aria).',
  },
  {
    date: '15 Nov 2026',
    items: [
      'Engine 0.14.1. Every system and the reference measured again on it, so all are on one engine. No verdict changed and no announcement is recorded differently. Where a rule differs in one scenario and follows in another, the reason now names both.',
      'One rule for when the text of a live region announces a change: it names the change, and it does not appear in the same form in a step without it. Otherwise the reason quotes the text and says why it is not counted. A live region that enters the page already holding text is recorded and read by the same rule. React Aria has one: when a value is removed by click, a region arrives holding the names of all three values run together, the removed one among them, and a region with the same text arrives when Tab moves into its tags and nothing is removed, so it is not counted as an announcement of the removal. Its verdict is unchanged; its reason now says this.',
      'Reference 0.1.2. Two fixes to its styles, found by a design review: in forced colours the focused input had no visible focus indicator, and the active suggestion was marked by a faint tint alone. Its behavior and its verdicts are unchanged.',
      'When a difference is described as another model: when its mechanism is on record and has an effect a person can perceive, on screen, in the accessibility tree or in an announcement. Atlassian’s arrow keys have none of the three, so they stay a difference, with what was recorded and seen given beside its evidence.',
    ],
  },
  {
    date: '13 Nov 2026',
    items: [
      'Engine 0.11.0. A step is now recorded until the page has been still for 400 ms after the key press, up from 100 ms: Chakra UI 3.38.0 writes its announcements about 100 ms late, and the shorter wait missed one.',
      '“Backspace twice”: the removal judged is the first Backspace that removes a chip, so a system that removes at once is no longer asked for the count after two removals.',
      'A chip marked without focus is judged the same way under “Backspace twice to remove” and “Arrows join the input and the chips”: Differs when neither focus, the accessibility tree nor an announcement shows it; Inconclusive when the tree or an announcement shows it but focus does not move.',
      'Chakra UI: the Backspace verdict changed from Inconclusive to Differs. From the measured starting state, three values and an untouched input, its first press shows none of the three.',
      'React Aria: shown but no longer counted. Its package also ships TokenField, a component for this pattern that the engine cannot measure yet.',
      'Every system measured again, Fluent 2, GitHub Primer and Chakra UI on newer versions. No other verdict changed.',
      'Atlassian is now described as measured: a searchable select, the component’s default, where its docs’ own multi-select example turns the text input off.',
    ],
  },
  {
    date: '11 Nov 2026',
    text: 'Engine 0.10.0. “The chips are one Tab stop” and “Arrows move between chips” apply only where the chips act as one widget, read from behavior: arrow keys move between them. Chips that are separate controls are Not applicable for both rules; their extra Tab stops count once, under “One stop for the whole field”.',
  },
  {
    date: '10 Nov 2026',
    text: 'Two rules added for the chips as one widget, with three scenarios that start on the last chip. “One stop for the whole field” became an Earshot recommendation: treating the input and its chips as one widget is Earshot’s design, not something the APG asks.',
  },
  {
    date: '9 Nov 2026',
    text: 'Every rule got a level: rule from the standards, or Earshot recommendation. “Keep focus in the field after a removal” now accepts any place in the field, not only the input. “Say how many remain” is judged only where the removal is announced, so a silent removal counts once. Agreement is counted over the systems a rule could be judged on. MUI, React Aria and Chakra UI added.',
  },
  {
    date: '8 Nov 2026',
    text: 'Systems are measured from their published npm package on a page Earshot builds, no longer on docs demos. Differs is shown in neutral, never red. Components deprecated by their own maintainers are shown but not counted in agreement.',
  },
  {
    date: '6 Nov 2026',
    text: 'Scenario “Shift+Tab from the input” added: chips usually come before the input, so a Tab stop on each remove button only shows going backwards.',
  },
];

/** A dated log of what changed in the rules, the scenarios and the counting, newest first. */
export function Changes() {
  return (
    <Part id="changes" title="What changed, and when">
      <p>
        Rules, scenarios and counting change as we learn. Each change is dated here, newest first.
        Earshot was first published on 19 Nov 2026; a verdict that changes after that is listed here
        with the versions and dates before and after.
      </p>
      <dl>
        {/* Two entries may share a date, so the key is the entry's place in the list. */}
        {changes.map(({ date, text, items }, index) => (
          <Fragment key={`${index}-${date}`}>
            <dt>{date}</dt>
            <dd>
              {text}
              {items && (
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </dd>
          </Fragment>
        ))}
      </dl>
    </Part>
  );
}
