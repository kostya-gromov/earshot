import type { Pattern } from '@earshot/contracts';
import { SystemMarks } from '@/features/evidence';
import { followsWords, levelWords, plural } from '@/lib/finding-words';
import { mostDiffering, type RuleFinding } from '@/lib/pattern-findings';
import styles from './pattern-opening.module.css';

/** How many differing rules the block shows in full; the rest are counted. */
const NAMED = 3;

/** "Combobox Pattern" from "Combobox Pattern: keyboard interaction": the page, not the section. */
const pageOf = (title: string) => title.split(': ')[0] ?? title;
const names = new Intl.ListFormat('en-GB', { type: 'conjunction' });
/** One case for the kind of rule on every page: "Rule from the standards". */
const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Where the rules come from, on every pattern page (2026-11-25): the APG pattern they start
 * from and how many Earshot recommendations go beyond it, or, with no APG pattern, the pages it is
 * built on. Said from the pattern's own data, so it cannot claim a source the rules do not cite.
 */
function whyRecommendations(pattern: Pattern, recommendations: number): string {
  const beyond =
    recommendations === 0
      ? 'every rule here comes from the standards'
      : recommendations === 1
        ? 'one Earshot recommendation goes beyond it, with its reason'
        : `${recommendations} Earshot recommendations go beyond it, each with its reason`;
  if (pattern.apg.dedicated) {
    return `The rules start from the APG ${pageOf(pattern.apg.pattern.title)}; ${beyond}.`;
  }
  const pages = pattern.apg.builtOn.map(({ title }) => pageOf(title));
  const on = pages.length === 1 ? 'the APG page' : 'the APG pages';
  return `APG has no pattern of its own for this one: Earshot builds it on ${on} ${names.format(pages)}, so most rules here are Earshot’s recommendations, each with its reason.`;
}

/**
 * What was measured, in one sentence, and where most rules are Earshot's own, why. A sentence,
 * not a band of large figures: the findings under it are the point, and the figures read louder
 * than them (2026-11-25).
 */
export function Composition(props: { pattern: Pattern; systems: number; split?: string }) {
  const { pattern, systems, split } = props;
  const fromStandards = pattern.rules.filter(({ level }) => level === 'rule').length;
  const recommendations = pattern.rules.length - fromStandards;
  const why = whyRecommendations(pattern, recommendations);
  return (
    <div className={styles.composition}>
      <p className={styles.lead}>
        {plural(systems, 'design system', 'design systems')} measured with{' '}
        {plural(pattern.rules.length, 'rule', 'rules')}: {fromStandards} from the standards,{' '}
        {plural(recommendations, 'Earshot recommendation', 'Earshot recommendations')}.
        {/* The conclusion finishes the sentence it belongs to, not a line of its own
            (design review 2026-11-25). */}
        {split && ` ${split}`}
      </p>
      <p className={styles.why}>{why}</p>
    </div>
  );
}

function RuleRow({ finding }: { finding: RuleFinding }) {
  return (
    <li className={styles.ruleRow}>
      <p className={styles.ruleHead}>
        <a href={`#rule-${finding.id}`}>{finding.title}</a>
        <span className={styles.level}>{capitalized(levelWords(finding))}</span>
      </p>
      <SystemMarks verdicts={finding.verdicts} label={`Verdicts on “${finding.title}”`} />
      <p className={styles.score}>
        <b>{followsWords(finding)}</b> follow
      </p>
    </li>
  );
}

/** The rules past the first three, by name, each a link to its panel (2026-11-25). */
function MoreRules({ rules }: { rules: readonly RuleFinding[] }) {
  return (
    <>
      A system also differs on{' '}
      {rules.map((rule, index) => (
        <span key={rule.id}>
          {index > 0 && (index === rules.length - 1 ? ' and ' : ', ')}
          <a href={`#rule-${rule.id}`}>{rule.title}</a>
        </span>
      ))}
      .
    </>
  );
}

/**
 * Where the counted systems differ: up to three rules, most differences first, each with every
 * system's mark, then what is left in one line.
 */
export function Differences({ findings }: { findings: readonly RuleFinding[] }) {
  const differing = findings.filter(({ differ }) => differ.length > 0);
  if (differing.length === 0) {
    return <p className={styles.all}>Every judged system follows every rule.</p>;
  }
  const others = findings.length - differing.length;
  const named = mostDiffering(findings, NAMED);
  return (
    <>
      <ul className={styles.ruleRows}>
        {named.map((finding) => (
          <RuleRow key={finding.id} finding={finding} />
        ))}
      </ul>
      <p className={styles.rest}>
        {differing.length > NAMED ? (
          <MoreRules rules={differing.filter((rule) => !named.includes(rule))} />
        ) : (
          others > 0 && `Every judged system follows the other ${plural(others, 'rule', 'rules')}.`
        )}
      </p>
    </>
  );
}
