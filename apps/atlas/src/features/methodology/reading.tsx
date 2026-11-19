import { Fragment } from 'react';
import { Part } from './how-we-measure';

const guards = [
  {
    title: 'One version, one browser, one date',
    text: 'A verdict describes the version named beside it, in Chromium, on the day it was measured. A later release may behave differently; the date tells you how old the result is.',
  },
  {
    title: 'Follows is not “accessible”',
    text: 'A rule covers one behavior of one pattern: keys, focus, announcements. A component that follows every rule here can still have barriers Atlas does not look at, such as contrast or touch.',
  },
  {
    title: 'Differs is not a defect',
    text: 'A system that differs chose another behavior. Each rule explains what that choice gains, what it costs and when it is reasonable. Only a rule from the standards carries a requirement, and the rule says which.',
  },
  {
    title: 'Agreement is a count, not a score',
    text: '“2 of 3 judged systems follow” says how many of the systems that could be judged behave this way. No system gets a total, and systems are not ranked.',
  },
  {
    title: 'Inconclusive is about the measurement',
    text: 'It means the engine could not decide, and says why. It says nothing about the system’s quality.',
  },
  {
    title: 'The docs example, not your product',
    text: 'Each system is measured as its own docs show it. Props, wrappers and custom code in a product can change the behavior.',
  },
];

/** What a result does and does not say: the misreadings a count or a badge invites. */
export function HowToReadAResult() {
  return (
    <Part id="reading" title="How to read a result">
      <dl>
        {guards.map(({ title, text }) => (
          <Fragment key={title}>
            <dt>{title}</dt>
            <dd>{text}</dd>
          </Fragment>
        ))}
      </dl>
    </Part>
  );
}

const terms = [
  ['Pattern', 'A kind of interactive component, such as an input with chips or a combobox.'],
  ['Rule', 'One behavior Atlas checks for a pattern.'],
  [
    'Rule from the standards',
    'A rule whose requirement comes from WCAG or the APG, cited beside it.',
  ],
  ['Atlas recommendation', 'A rule Atlas adds beyond the standards, with its reason.'],
  [
    'Reference',
    'Atlas’s own implementation of a pattern: the baseline the rules are written from.',
  ],
  ['System', 'A measured design system or component library.'],
  ['Scenario', 'A fixed sequence of keys or clicks from a known starting state.'],
  [
    'Recording',
    'The steps the engine captured for one scenario: focus, tree changes, announcements.',
  ],
  ['Engine', 'The tool that presses the keys and records the result.'],
  ['Verdict', 'Follows, Differs, Inconclusive or Not applicable, with a short reason.'],
  ['Judged systems', 'The systems with Follows or Differs for a rule: the ones agreement counts.'],
  ['Semantic model', 'Spoken lines built from the accessibility tree in one fixed format.'],
] as const;

/** The words Atlas uses with one fixed meaning each. */
export function Terms() {
  return (
    <Part id="terms" title="Terms">
      <dl>
        {terms.map(([term, meaning]) => (
          <Fragment key={term}>
            <dt>{term}</dt>
            <dd>{meaning}</dd>
          </Fragment>
        ))}
      </dl>
    </Part>
  );
}
