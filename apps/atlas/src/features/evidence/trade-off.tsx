import type { ReactNode } from 'react';
import type { ModelTradeOff, RuleTradeOff } from '@/lib/trade-offs';
import styles from './evidence.module.css';

export interface MeasuredDifference {
  adapter: string;
  system: string;
  /** The evaluator's own summary of the differing verdict. */
  summary: string;
}

// A key keeps its capital after "Alternative:": "tab on the last element" is not the key Tab.
const startsWithKey =
  /^(Tab|Shift|Enter|Escape|Space|Home|End|Backspace|Delete|Up Arrow|Down Arrow|Left Arrow|Right Arrow)\b/;

const lowerFirst = (text: string) =>
  startsWithKey.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);

/** "Atlassian, GitHub Primer and MUI". */
const listed = (names: readonly string[]): string =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

/** Systems that differ in the same words, told once: three identical lines read as noise. */
function bySummary(differences: readonly MeasuredDifference[]): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const { system, summary } of differences) {
    groups.set(summary, [...(groups.get(summary) ?? []), system]);
  }
  return [...groups];
}

/**
 * Who does it, and what they do, in the evaluator's words: the way into a trade-off. A reader
 * arrives asking about a system ("why does Atlassian differ?"), not about an abstract alternative.
 */
function Who({ differences }: { differences: readonly MeasuredDifference[] }) {
  if (differences.length === 0) {
    return <p className={styles.whoNone}>Not seen in the measured systems</p>;
  }
  return (
    <ul className={styles.who} aria-label="Measured differences">
      {bySummary(differences).map(([summary, systems]) => (
        <li key={summary}>
          <b>{listed(systems)}</b>
          <span>{summary}</span>
        </li>
      ))}
    </ul>
  );
}

interface Terms {
  gain: string;
  cost: string;
  reasonableWhen: string;
}

/** Label beside value, row by row: one word or four lines, the labels stay aligned. */
function TradeTerms({ gain, cost, reasonableWhen }: Terms) {
  return (
    <dl className={styles.tradeTerms}>
      <div>
        <dt>You gain</dt>
        <dd>{gain}</dd>
      </div>
      <div>
        <dt>You pay</dt>
        <dd>{cost}</dd>
      </div>
      <div>
        <dt>Reasonable when</dt>
        <dd>{reasonableWhen}</dd>
      </div>
    </dl>
  );
}

interface RowProps {
  who: ReactNode;
  title: string;
  children?: ReactNode;
}

/** One trade-off: who on the left, the alternative and its terms on the right. */
function Row({ who, title, children }: RowProps) {
  return (
    <>
      <div className={styles.tradeWho}>{who}</div>
      <div className={styles.tradeBody}>
        <h5>{title}</h5>
        {children}
      </div>
    </>
  );
}

interface TradeOffProps {
  tradeOff: RuleTradeOff;
  differences: readonly MeasuredDifference[];
}

/**
 * The hand-written trade-off for a rule (CLAUDE.md 4), with the measured systems that take it,
 * in the evaluator's words. Differing is not called wrong (CLAUDE.md 2.5).
 */
export function TradeOff({ tradeOff, differences }: TradeOffProps) {
  // A note where the rule has no alternative: one line across the row, with no "who" beside it.
  if (tradeOff.kind !== 'alternative') {
    return (
      <section className={styles.trade}>
        <p className={styles.tradeNote}>{tradeOff.note}</p>
      </section>
    );
  }
  return (
    // Not a named region: every rule has several, so a landmark list would fill with them.
    <section className={styles.trade}>
      <Row
        who={<Who differences={differences} />}
        title={`Alternative: ${lowerFirst(tradeOff.alternative)}`}
      >
        <TradeTerms {...tradeOff} />
      </Row>
    </section>
  );
}

/** Differences no written alternative describes: listed as measured, without a trade-off. */
export function OtherDifferences({ differences }: { differences: readonly MeasuredDifference[] }) {
  return (
    <section className={styles.trade} aria-label="Other measured differences">
      <Row who={<Who differences={differences} />} title="Other measured differences">
        <p className={styles.modelBasis}>
          Measured as recorded. No alternative is written for these.
        </p>
      </Row>
    </section>
  );
}

interface ModelNoteProps {
  /** The comparison links here; a link opens the rule's evidence and moves focus to the note. */
  id: string;
  model: ModelTradeOff;
  /** The systems that use this model, by display name. */
  systems: readonly string[];
}

/**
 * A different model of the whole pattern, chosen on purpose by a measured system. One design
 * decision explains several "differs", so it is told once, as a trade-off, not as a defect.
 */
export function ModelNote({ id, model, systems }: ModelNoteProps) {
  const who = (
    <ul className={styles.who}>
      <li>
        <b>{listed(systems)}</b>
        <span>A different model of the pattern</span>
      </li>
    </ul>
  );
  return (
    <section
      id={id}
      tabIndex={-1}
      className={styles.trade}
      aria-label={`Different model in ${systems.join(', ')}`}
    >
      <Row who={who} title={`Different model: ${lowerFirst(model.model)}`}>
        <p className={styles.modelHow}>{model.howItWorks}</p>
        <TradeTerms {...model} />
        <p className={styles.modelBasis}>{model.basis}</p>
      </Row>
    </section>
  );
}
