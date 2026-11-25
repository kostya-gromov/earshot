import type { ReactNode } from 'react';
import { publicRepository } from '@/lib/correction-link';
import { ExternalLink, SpeechLine } from '@/ui';
import styles from './methodology.module.css';

/** One part of the methodology: a heading and its prose, with an anchor others can link to. */
/**
 * What was checked by hand against a real screen reader, no further than the notes support: a
 * first spot check of input with chips, to be repeated item by item (verdict audit, 2026-11-19),
 * and the whole-page passes before tabs, the dialog and select were published (verdict audit,
 * 2026-11-25).
 */
function ManualCheck() {
  return (
    <p>
      Checks by hand with a real screen reader have begun. A first pass, on 19 Nov 2026 with
      VoiceOver on macOS, went through input with chips: Atlassian on Left Arrow, Backspace and
      Shift+Tab from the empty field, a chip removed in Fluent 2, Primer, MUI and React Aria, and
      &ldquo;3 of 3&rdquo; on the reference. Its results were not written down item by item, so it
      is being repeated against the published recordings before anything is said about the match.
      The pages for tabs (19 Nov), the modal dialog (23 Nov) and select (25 Nov) were each gone
      through as a whole with VoiceOver before they were published; those passes were not written
      down item by item either. Not checked yet: combobox, menu button, and NVDA.{' '}
      <ExternalLink href={`${publicRepository}/tree/main/docs/a11y-checks`}>
        The notes of each check
      </ExternalLink>
    </p>
  );
}

export function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.part} aria-labelledby={`${id}-title`} id={id}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}

const conditions = [
  ['Browser', 'Chromium; the exact version is in every measurement file'],
  ['Viewport', '1280 by 800'],
  ['Locale and time zone', 'en-US, UTC'],
  ['Color scheme', 'Light'],
  ['Motion', 'Reduced, so the engine never judges a page mid-animation'],
  ['Input', 'Real key presses and clicks, one step at a time'],
  [
    'Settle before recording',
    'Two animation frames, then 400 ms with no changes, at most one second',
  ],
  ['Runs', 'Three per scenario; all three stay in the file'],
] as const;

/** The fixed conditions of every run, as a table: the same for every system. */
function Conditions() {
  return (
    <table className={styles.table}>
      <caption className="visually-hidden">Fixed conditions of every run</caption>
      <tbody>
        {conditions.map(([name, value]) => (
          <tr key={name}>
            <th scope="row">{name}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function WhatARunDoes() {
  return (
    <Part id="run" title="What one run does">
      <p>
        For each system, Earshot builds a page that renders the system’s published npm package at an
        exact version, as the system’s own docs example does, with the same three people selected
        and a field before and after it. The engine opens that page in Chromium under fixed
        conditions and installs its recorders before the page loads.
      </p>
      <Conditions />
      <ol>
        <li>
          It checks the component is in the scenario’s starting state, set through the component’s
          own props, and puts focus in the input. It never edits the page. If the state is not
          there, the scenario is inconclusive and says why.
        </li>
        <li>
          Some scenarios start inside the component. In input with chips, those about the chips on
          their own start on the last chip: the engine focuses it directly, as a user who reached it
          any way would be. A chip that cannot take focus makes those scenarios inconclusive.
        </li>
        <li>
          It presses real keys, one step at a time, and waits for the page to settle: two animation
          frames, then 400 ms without changes or running animations, at most one second.
        </li>
        <li>
          After every step it records where focus is, what was announced, and how the accessibility
          tree changed.
        </li>
        <li>
          It runs every scenario three times. If the runs disagree, the verdict is inconclusive and
          all runs stay in the published file. No majority is picked.
        </li>
      </ol>
    </Part>
  );
}

export function WhatIsRecorded() {
  return (
    <Part id="recorded" title="What is recorded">
      <dl>
        <dt>Focus</dt>
        <dd>
          Role, name, states and position come from Chromium’s accessibility tree, the same data
          screen readers receive, not from the page’s markup. One thing is read from the markup: the
          kind of popup an element says it has, from its aria-haspopup attribute as written, because
          the tree does not tell a written value from a role’s default. Shadow roots and same-origin
          frames are followed. Focus that falls to the page itself is recorded as such. An item of a
          pattern (a chip, an option, a menu item) is recognised by structure, never by its name:
          its set position in the tree, or else its place among the items the adapter finds. Each
          evidence card says how they were found, and an item with no set position is noted there
          rather than counted against a rule.
        </dd>
        <dt>Announcements</dt>
        <dd>
          Text written into live regions (aria-live, status, alert, log). A region created together
          with its message is flagged, because screen readers often miss those.
        </dd>
        <dt>Accessibility tree changes</dt>
        <dd>
          Nodes added, removed, renamed or changed in state under the component, matched by role and
          name rather than by DOM identity, so a re-rendered item is not reported as replaced.
        </dd>
      </dl>
    </Part>
  );
}

export function SemanticModel() {
  return (
    <Part id="semantic-model" title="The semantic model">
      <p>
        What the page shows in serif italic is a deterministic model of what a screen reader would
        say, built from the recorded data in one fixed format: name, role, a combobox’s value, the
        popup the element says it has, position, then states. Assertive announcements come first,
        then the focus line, then polite announcements. A focus line looks like this:
      </p>
      <SpeechLine source="focus" size="md">
        Remove Greg Fisher, button, 2 of 2
      </SpeechLine>
      <p>
        It is not NVDA, JAWS or VoiceOver output. Real screen readers phrase things differently and
        differ from each other. Runs with real screen readers are planned for a later phase.
      </p>
      <ManualCheck />
      <p>Simplifications we know of:</p>
      <ul>
        <li>The full text of a live region is used; aria-atomic and aria-relevant are ignored.</li>
        <li>
          A description (aria-describedby) is recorded but not said. Where a system gives something
          only as a description, the words under the recording say so.
        </li>
        <li>
          A popup is said as “has popup menu” (or listbox, tree, grid, dialog), in these words for
          every system, when the focused element carries aria-haspopup with a value that is not the
          default of its role. A combobox has a listbox by default, so aria-haspopup=“listbox” on a
          combobox is not said: writing the default changes nothing for assistive technology, and
          two systems must not read differently for it.
        </li>
        <li>
          Chromium does not expose a position such as “3 of 3” directly, so the engine counts the
          items of the nearest list, option or similar set.
        </li>
      </ul>
    </Part>
  );
}
