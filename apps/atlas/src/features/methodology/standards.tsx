import type { Pattern } from '@earshot/contracts';
import { citedPages, ruleLevels, type CitedPage } from '@/lib/cited-sources';
import { Part } from './how-we-measure';
import styles from './methodology.module.css';
import { ExternalLink } from '@/ui';

const counted = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

const count = (rules: number): string => (rules === 0 ? 'None' : counted(rules, 'rule'));

/** Rules citing the page as related or rationale, then recommendations citing it at all. */
const alsoCount = ({ related, recommendations }: CitedPage): string => {
  const parts = [
    related > 0 && counted(related, 'rule'),
    recommendations > 0 && counted(recommendations, 'recommendation'),
  ].filter((part) => typeof part === 'string');
  return parts.length === 0 ? 'None' : parts.join(', ');
};

/** Which kinds of page the rules apply, said from the rules, so it stays true as they change. */
function appliedLine(pages: readonly CitedPage[]): string {
  const applied = pages.filter((page) => page.applied > 0);
  return applied.every(({ kind }) => kind === 'apg')
    ? 'So a rule from the standards cites the page it applies, and today every such page is an APG pattern, practice or example, because APG is where a component’s keys, roles and states are described.'
    : 'So a rule from the standards cites the page it applies, and that page is most often an APG pattern, practice or example, because APG is where a component’s keys, roles and states are described.';
}

/**
 * How the rules use WCAG, said from the rules themselves: whether any rule applies a criterion
 * directly, or all cite criteria as related. Written for both cases, so it stays true.
 */
function wcagLine(pages: readonly CitedPage[]): string {
  const criteria = pages.filter(({ kind }) => kind === 'wcag');
  const applied = criteria.filter((page) => page.applied > 0).length;
  if (criteria.length === 0) return 'No rule cites a WCAG criterion today.';
  if (applied === 0) {
    return 'No rule applies a WCAG criterion directly today: the criteria are cited as related or as rationale, each with a note on how the criterion bears on it.';
  }
  return `${applied} of the ${criteria.length} WCAG criteria cited are applied directly; the others are cited as related or as rationale, each with a note on how the criterion bears on it.`;
}

/** One cited page. Roles are written out: on a phone the row is restyled as a stacked record. */
function PageRow({ page }: { page: CitedPage }) {
  return (
    <tr role="row">
      <th scope="row" role="rowheader">
        <ExternalLink href={page.url}>{page.label}</ExternalLink>
      </th>
      <td role="cell" data-label="Applied by">
        {count(page.applied)}
      </td>
      <td role="cell" data-label="Also cited by">
        {alsoCount(page)}
      </td>
      <td role="cell" data-label="In">
        {page.patterns.join(', ')}
      </td>
    </tr>
  );
}

/** Every page the rules cite, from the rules themselves: it cannot say more than they do. */
function CitedPages({ pages }: { pages: readonly CitedPage[] }) {
  return (
    <div className={styles.scroller}>
      <table className={`${styles.table} ${styles.stack}`} role="table">
        <caption className="visually-hidden">The WCAG and APG pages the rules cite</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              Page
            </th>
            <th scope="col" role="columnheader">
              Applied by
            </th>
            <th scope="col" role="columnheader">
              Also cited by
            </th>
            <th scope="col" role="columnheader">
              In
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {pages.map((page) => (
            <PageRow key={page.url} page={page} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Whose requirement each expectation is (verdict audit, 2026-11-09). */
function Levels({ patterns }: { patterns: readonly Pattern[] }) {
  const { rules, recommendations } = ruleLevels(patterns);
  return (
    <>
      <h3 id="levels">Rules and recommendations</h3>
      <p>
        A rule is what a cited APG pattern, practice or example asks, in our words. A WCAG criterion
        cited beside it is marked as related or as rationale, and its note says how the criterion
        bears on the rule. A recommendation is advice we add, or a note in APG that Earshot does not
        hold as a rule, with the reason on the recommendation: it is labelled &ldquo;Earshot
        recommendation&rdquo;. A recommendation is not a WCAG requirement, and Earshot does not
        judge WCAG conformance.
      </p>
      <p>
        Across the {patterns.length} patterns there are {rules} rules from the standards and{' '}
        {recommendations} Earshot recommendations. Every one links its sources on its pattern page.
      </p>
      <p>
        Agreement counts the systems a rule could be judged on. A system whose verdict is
        inconclusive is shown as not judged, not as one that does not follow.
      </p>
    </>
  );
}

/** The same steps for every pattern, before any system's name appears beside a verdict. */
function HowAPatternIsAdded() {
  return (
    <>
      <h3>How a pattern is added</h3>
      <ol>
        <li>
          It starts as a written proposal: its rules checked against the current APG page, its
          scenarios, and the systems that could be measured.
        </li>
        <li>
          Each rule is written from a dated copy of the page it cites, kept with the project, and
          the cited pages are checked for changes.
        </li>
        <li>
          Earshot builds a reference implementation and measures it with the same engine. It differs
          on no rule of its pattern.
        </li>
        <li>
          Systems are chosen by one inclusion check, described below, and measured on their
          published packages.
        </li>
        <li>Nothing is shown as measured without its version, browser, engine and date.</li>
      </ol>
    </>
  );
}

/**
 * What every pattern has in common: where its rules come from. First on the page, so the method
 * is read as one for all patterns and not as the story of the first (2026-11-17). The
 * two quotations are from the dated copies in docs/sources: WCAG 2.2 Understanding 2.1.1 and
 * APG "Developing a Keyboard Interface".
 */
export function Standards({ patterns }: { patterns: readonly Pattern[] }) {
  const pages = citedPages(patterns);
  return (
    <Part id="standards" title="What the rules rest on">
      <p>
        Earshot rests on two W3C sources, and they answer different questions. WCAG 2.2 says what
        must be true for the person using a page, whatever the component: its criterion 2.1.1 asks
        that &ldquo;All functionality of the content is operable through a keyboard
        interface&hellip;&rdquo;. The ARIA Authoring Practices Guide (APG) describes how a component
        of a given kind is expected to work: its keys, its roles, its states. Its keyboard practice
        says that &ldquo;consistent application of the common GUI keyboard interface conventions
        described in the APG patterns is important, especially for assistive technology
        users&rdquo;.
      </p>
      <p>
        {appliedLine(pages)} {wcagLine(pages)} These are all the pages the rules and recommendations
        cite today: &ldquo;applied by&rdquo; counts the rules from the standards that apply a page,
        and &ldquo;also cited by&rdquo; the rules that cite it as related or as rationale and the
        Earshot recommendations that cite it.
      </p>
      <CitedPages pages={pages} />
      <Levels patterns={patterns} />
      <HowAPatternIsAdded />
    </Part>
  );
}
