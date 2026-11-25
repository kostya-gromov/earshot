import { VerdictBadge } from '@/features/evidence';
import { measuredOn } from '@/lib/measured-on';
import type { SystemPattern, SystemRule } from '@/lib/system-profile';
import styles from './system-page.module.css';

const why: Readonly<Record<NonNullable<SystemRule['explainedBy']>, string>> = {
  model: 'A trade-off describes its different model; the rule shows it',
  alternative: 'A trade-off is written for it; the rule shows it',
};

const plain = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const isSame = (a: string, b: string) => plain(a) === plain(b);

function RuleRow({ patternId, rule }: { patternId: string; rule: SystemRule }) {
  return (
    <li className={styles.rule} data-verdict={rule.verdict}>
      <VerdictBadge verdict={rule.verdict} />
      <div>
        <p className={styles.ruleHead}>
          <a href={`/patterns/${patternId}/#rule-${rule.id}`}>{rule.title}</a>
          <span className={styles.level}>
            {rule.isFromStandards ? 'Rule from the standards' : 'Earshot recommendation'}
          </span>
        </p>
        {/* "One Tab stop / One Tab stop": a summary that repeats the title says nothing more. */}
        {!isSame(rule.summary, rule.title) && <p className={styles.summary}>{rule.summary}</p>}
        {rule.verdict !== 'follows' && rule.explainedBy && (
          <p className={styles.why}>{why[rule.explainedBy]}</p>
        )}
      </div>
    </li>
  );
}

/** "Follows 5 of 8 judged rules; 2 differ, both Earshot recommendations." */
function countWords(rules: readonly SystemRule[]): string {
  const follows = rules.filter(({ verdict }) => verdict === 'follows').length;
  const differ = rules.filter(({ verdict }) => verdict === 'differs');
  const judged = follows + differ.length;
  if (judged === 0) return 'No rule could be judged.';
  const fromStandards = differ.filter(({ isFromStandards }) => isFromStandards).length;
  const base = `Follows ${follows} of ${judged} judged ${judged === 1 ? 'rule' : 'rules'}`;
  if (differ.length === 0) return `${base}.`;
  const where =
    differ.length === 1
      ? fromStandards === 1
        ? 'on a rule from the standards'
        : 'on an Earshot recommendation'
      : `${fromStandards} of them on rules from the standards`;
  return `${base}; ${differ.length} ${differ.length === 1 ? 'differs' : 'differ'}, ${where}.`;
}

/**
 * One pattern as this system did on it: what was measured and when, whether it counts and why
 * not, then every rule with its verdict, differences first. Neutral except the verdicts' own
 * marks: differing is not failing (apps/atlas/CLAUDE.md).
 */
export function SystemPatternBlock({ entry }: { entry: SystemPattern }) {
  const { pattern } = entry;
  const title = (
    <h2 className={styles.patternName}>
      <a href={`/patterns/${pattern.id}/`}>{pattern.name}</a>
    </h2>
  );
  if (entry.kind === 'not-measured') {
    return (
      <section className={styles.pattern} aria-label={pattern.name}>
        <div className={styles.side}>
          {title}
          <p className={styles.meta}>Not measured: {entry.reason}</p>
        </div>
      </section>
    );
  }
  return (
    <section
      className={styles.pattern}
      aria-label={pattern.name}
      data-not-counted={entry.notCounted ? true : undefined}
    >
      <div className={styles.side}>
        {title}
        <p className={styles.meta}>
          {entry.component ?? 'Component'} · {entry.version} · measured{' '}
          {measuredOn(entry.measuredAt)}
        </p>
        <p className={styles.counted}>
          {entry.notCounted ? `Shown, not counted: ${entry.notCounted}.` : countWords(entry.rules)}
        </p>
      </div>
      <ul className={styles.rules}>
        {entry.rules.map((rule) => (
          <RuleRow key={rule.id} patternId={pattern.id} rule={rule} />
        ))}
      </ul>
    </section>
  );
}
