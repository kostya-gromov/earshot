import type { CSSProperties } from 'react';
import type { MethodTotals } from '@/lib/method-totals';
import { FigureStage } from './figure-stage';
import { Lead, plural } from './method-strip';
import { RuleFigure } from './rule-figure';
import styles from './method.module.css';

type Rules = MethodTotals['rules'];

const levels = [
  { key: 'fromStandards', label: 'From the standards' },
  { key: 'recommendations', label: 'Atlas recommendations' },
] as const;

/**
 * What the drawing covers: the rules from the standards, and that the others are not of that
 * kind. The drawing joins WCAG and APG to a rule; while no rule applies a WCAG criterion
 * directly, the caption says which of the two a rule applies and which it only cites, so the
 * drawing does not promise more than the list beside it (2026-11-17).
 */
function builtFrom({ total, fromStandards, recommendations, cited }: Rules): string {
  const counted = `How ${fromStandards} of ${total} ${total === 1 ? 'rule is' : 'rules are'} built`;
  const appliesWcag = cited.some((page) => isWcag(page) && !page.isRelatedOnly);
  const drawn = appliesWcag
    ? `${counted}.`
    : `${counted}: each applies an APG page, and cites WCAG where a criterion relates.`;
  if (recommendations === 0) return drawn;
  const others =
    recommendations === 1
      ? 'The other 1 is an Atlas recommendation; it says why.'
      : `The other ${recommendations} are Atlas recommendations; each says why.`;
  return `${drawn} ${others}`;
}

interface RuleLeadProps {
  rules: Rules;
  /** How many patterns the rules belong to. */
  patterns: number;
}

/** Step 1's lead: how many rules, in how many patterns. Where steps 2 and 3 have theirs. */
export function RuleLead({ rules, patterns }: RuleLeadProps) {
  return (
    <Lead value={rules.total}>
      {rules.total === 1 ? 'rule' : 'rules'} so far, in {plural(patterns, 'pattern', 'patterns')}
    </Lead>
  );
}

/**
 * Step 1, under its title, in the language of step 2: a drawing of how a rule is made, and the
 * two levels counted with a meter each. Neutral greys: blue and violet already mean focus and
 * speech on this site.
 */
export function RuleAside({ rules }: { rules: Rules }) {
  return (
    <FigureStage className={`${styles.show} ${styles.ruleAside}`} playWhen="in-view">
      <figure className={styles.ruleFigure} data-figure>
        <RuleFigure />
        {/* The drawing shows a rule that applies the standards; it must not speak for the rest. */}
        <figcaption>{builtFrom(rules)}</figcaption>
      </figure>
      <div className={styles.rows}>
        {levels.map(({ key, label }, index) => (
          <p
            key={key}
            className={styles.row}
            data-tone="neutral"
            data-empty={rules[key] === 0 || undefined}
            style={
              {
                '--row': index,
                '--share': rules.total > 0 ? rules[key] / rules.total : 0,
              } as CSSProperties
            }
          >
            <span>{label}</span>
            <strong className={styles.value}>{rules[key]}</strong>
          </p>
        ))}
      </div>
    </FigureStage>
  );
}

const isWcag = ({ label }: Rules['cited'][number]) => label.startsWith('WCAG');

/** Criteria in the order of their numbers, so 2.4.3 comes before 4.1.2 whoever cited it first. */
const byCriterion = (a: Rules['cited'][number], b: Rules['cited'][number]) =>
  a.label.localeCompare(b.label, 'en', { numeric: true });

/** What kind of APG page it is, read from its address: said once per row instead of "APG". */
function kindOf(cited: Rules['cited'][number]): string {
  if (isWcag(cited)) return cited.label;
  if (cited.url.includes('/examples/')) return 'Example';
  return cited.url.includes('/practices/') ? 'Practice' : 'Pattern';
}

function CitedList({ pages }: { pages: Rules['cited'] }) {
  return (
    <ul className={styles.cited}>
      {pages.map((cited) => (
        <li key={cited.url}>
          <span className={styles.citedLabel}>{kindOf(cited)}</span>
          <a href={cited.url}>{cited.title}</a>
        </li>
      ))}
    </ul>
  );
}

/**
 * One standard's cited pages. Where some are applied by a rule and some only related, they are
 * two lists with a heading each: "related" is then said once, and the page a rule applies
 * directly stands apart. A related page is not a requirement, so it is never listed as one.
 */
function CitedGroup(props: { id: string; title: string; unit: string; pages: Rules['cited'] }) {
  const { id, title, unit, pages } = props;
  if (pages.length === 0) return null;
  const applied = pages.filter(({ isRelatedOnly }) => !isRelatedOnly);
  const related = pages.filter(({ isRelatedOnly }) => isRelatedOnly);
  return (
    <section aria-labelledby={id}>
      <h4 id={id} className={styles.citedHead}>
        {title} <span>{unit}</span>
      </h4>
      {applied.length > 0 && related.length > 0 && <p className={styles.citedSub}>Applied</p>}
      {/* No empty list: since 2026-11-17 no rule applies a WCAG criterion directly. */}
      {applied.length > 0 && <CitedList pages={applied} />}
      {related.length > 0 && (
        <>
          <p className={styles.citedSub}>Related, not applied directly</p>
          <CitedList pages={related} />
        </>
      )}
    </section>
  );
}

/**
 * Step 1, beside it: every page of the standards the rules cite, linked, so where the rules
 * start from can be checked at its source. In two groups, each with its count: the criteria of
 * WCAG, then the pages of APG.
 */
export function RuleSources({ rules }: { rules: Rules }) {
  const wcag = rules.cited.filter(isWcag).toSorted(byCriterion);
  const apg = rules.cited.filter((page) => !isWcag(page));
  return (
    <div className={`${styles.plate} ${styles.sources}`}>
      {/* Pages, not rules: said so that it is not read as the count of rules from the standards. */}
      <p className={styles.citedTotal}>
        <strong>{rules.cited.length}</strong> {rules.cited.length === 1 ? 'page' : 'pages'} cited
      </p>
      <CitedGroup
        id="cited-wcag"
        title="WCAG"
        unit={plural(wcag.length, 'criterion', 'criteria')}
        pages={wcag}
      />
      <CitedGroup
        id="cited-apg"
        title="APG"
        unit={plural(apg.length, 'page', 'pages')}
        pages={apg}
      />
    </div>
  );
}
