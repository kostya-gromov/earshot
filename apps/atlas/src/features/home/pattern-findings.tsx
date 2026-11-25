import type { PatternEntry } from '@/data/pattern-entries';
import { followsWords, levelWords, plural, whyWords } from '@/lib/finding-words';
import {
  differenceSplit,
  mostDiffering,
  ruleFindings,
  type RuleFinding,
} from '@/lib/pattern-findings';
import { plannedPatterns } from '@/lib/planned-patterns';
import { SystemMarks } from '@/features/evidence';
import { SectionHead } from '@/ui';
import { countedSystems } from './pattern-card';
import styles from './findings.module.css';

const ruleHref = (patternId: string, ruleId: string) => `/patterns/${patternId}/#rule-${ruleId}`;

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The rule, its kind, every counted system with its mark, and where a trade-off is written for
 * the systems that differ, the way to it. The count stands apart on the right, large, so the rows
 * compare at a glance down the list (2026-11-25: the purpose was right, the look was not).
 */
function Finding({ patternId, finding }: { patternId: string; finding: RuleFinding }) {
  const why = whyWords(finding);
  const href = ruleHref(patternId, finding.id);
  return (
    <>
      <div className={styles.finding}>
        <p className={styles.rule}>
          <a href={href}>{finding.title}</a>
          <span className={styles.level}>{capitalized(levelWords(finding))}</span>
        </p>
        <SystemMarks verdicts={finding.verdicts} label={`Verdicts on “${finding.title}”`} />
        <p className={styles.why}>
          {why ? (
            <>
              {capitalized(why)}. <a href={href}>See the trade-off</a>
            </>
          ) : (
            <a href={href}>See why systems differ</a>
          )}
        </p>
      </div>
      <p className={styles.score}>
        <b>{followsWords(finding)}</b>
        <span>follow</span>
      </p>
    </>
  );
}

function Row({ entry }: { entry: PatternEntry }) {
  const { pattern } = entry;
  const [top] = mostDiffering(ruleFindings(entry), 1);
  const counted = countedSystems(entry).length;
  return (
    <li className={styles.row}>
      <div className={styles.pattern}>
        <h3 className={styles.name}>
          <a href={`/patterns/${pattern.id}/`}>{pattern.name}</a>
        </h3>
        <p className={styles.counts}>
          {plural(pattern.rules.length, 'rule', 'rules')} · {plural(counted, 'system', 'systems')}{' '}
          counted
        </p>
      </div>
      {top ? (
        <Finding patternId={pattern.id} finding={top} />
      ) : (
        <p className={styles.finding}>Every judged system follows every rule.</p>
      )}
    </li>
  );
}

/** "Of the 28 differences, 11 are on rules from the standards and 17 on Earshot recommendations." */
function Split({ entries }: { entries: readonly PatternEntry[] }) {
  const { differences, fromStandards } = differenceSplit(entries.flatMap(ruleFindings));
  if (differences === 0) return null;
  // "Across all patterns": the rows above show one rule each, and a reader counting their marks
  // asked where 28 came from (first-visit review); the number of rules is said once, in the
  // method below (design review 2026-11-25).
  return (
    <p className={styles.split}>
      Across all patterns, not only the rules above: of the{' '}
      {plural(differences, 'difference', 'differences')}, {fromStandards}{' '}
      {fromStandards === 1 ? 'is' : 'are'} on rules from the standards and{' '}
      {differences - fromStandards} on Earshot recommendations.
    </p>
  );
}

/**
 * Every pattern as one row with its finding: the rule the most counted systems differ from, and
 * where a trade-off is written for the systems that differ, that it is. It answers what a newcomer could not
 * find on the page (external feedback, 2026-11-24: "I don't understand what conclusions to
 * draw"), and replaced the three cards of the patterns added last (2026-11-25).
 */
export function PatternFindings({ entries }: { entries: readonly PatternEntry[] }) {
  return (
    <section id="patterns" className={styles.section} aria-labelledby="patterns-title">
      <SectionHead
        id="patterns-title"
        title="Where systems differ."
        quiet="One line per pattern."
        isSplit
      >
        For each pattern, the rule the most design systems differ from. Differing is not failing:
        where a trade-off is written for a system, the pattern page shows it.
      </SectionHead>
      <ul className={styles.rows}>
        {entries.map((entry) => (
          <Row key={entry.pattern.id} entry={entry} />
        ))}
        {plannedPatterns.map(({ id, name }) => (
          <li key={id} className={styles.row} data-planned>
            <div className={styles.pattern}>
              <h3 className={styles.name}>{name}</h3>
              <p className={styles.counts}>In progress, not measured yet</p>
            </div>
          </li>
        ))}
      </ul>
      <Split entries={entries} />
    </section>
  );
}
