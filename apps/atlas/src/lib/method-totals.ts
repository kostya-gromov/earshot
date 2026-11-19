import type { FocusInfo, Measurement, Pattern, Source, Step } from '@earshot/contracts';
import { isReference, ruleAgreement } from './agreement';

/** One pattern with everything measured for it. */
export interface MethodSource {
  pattern: Pattern;
  measurements: readonly Measurement[];
  /** Adapters measured but not counted in agreement (deprecated, or a stand-in component). */
  notCounted: ReadonlySet<string>;
}

/** A page of the standards that a rule cites, as the home page lists it. */
export interface CitedPage {
  /** "WCAG 2.4.3" for a success criterion, "APG" for a practice or pattern page. */
  label: string;
  title: string;
  url: string;
  /**
   * No rule applies the page directly: every citation of it carries a note such as "Related" or
   * "Cited as rationale". Shown, so a related page is not read as a requirement.
   */
  isRelatedOnly: boolean;
}

export interface MethodTotals {
  /**
   * The patterns that have at least one counted file, each with its rules and the systems its
   * agreement figures count, so a reader can add the totals up again from the parts.
   */
  patterns: readonly { name: string; rules: number; systems: number }[];
  /**
   * Counted design systems the totals come from, each once however many patterns it is measured
   * for: the reference and systems set aside are left out, so recordings and verdicts describe
   * the same systems.
   */
  systems: number;
  /** How often each scenario was run, when every counted file agrees on it. */
  runs: number | undefined;
  /** ISO date of the most recent counted measurement, when there is one. */
  latest: string | undefined;
  rules: {
    total: number;
    fromStandards: number;
    recommendations: number;
    /** Each page of the standards the rules cite, once, in the order the rules cite them. */
    cited: readonly CitedPage[];
  };
  recording: {
    /** Recorded steps in every run of every scenario, in the counted systems. */
    steps: number;
    focusMoved: number;
    treeChanged: number;
    announced: number;
  };
  /** Verdicts of the counted design systems only, as the pattern pages count them. */
  verdicts: {
    total: number;
    follows: number;
    differs: number;
    /** Of the differing verdicts, those against a rule the standards ask for (level "rule"). */
    differsFromStandards: number;
    inconclusive: number;
    notApplicable: number;
  };
}

const isMeasured = (measurement: Measurement) => measurement.provenance.status === 'measured';

/**
 * Keyboard focus is on the same element when the engine read the same place, role and name for
 * it. A change of aria-activedescendant alone is not a move: focus stayed where it was (verdict
 * audit 2026-11-14).
 */
const focusKey = ({ isBody, role, name, item }: FocusInfo): string =>
  JSON.stringify([isBody, role, name, item?.index]);

const hasFocusMoved = (step: Step) => focusKey(step.focusBefore) !== focusKey(step.focusAfter);

const hasTreeChanged = ({ axDiff }: Step) =>
  axDiff.added.length + axDiff.removed.length + axDiff.changed.length > 0;

const recordedSteps = (measurement: Measurement): Step[] =>
  measurement.scenarios.flatMap((scenario) =>
    scenario.runs.flatMap((run) => (run.status === 'setup-failed' ? [] : run.steps)),
  );

const sourceLabels = { apg: 'APG', other: '' } as const;

/** "Understanding SC 2.4.3: Focus Order" reads as "Focus Order" next to its "WCAG 2.4.3". */
const citedPage = (source: Source, isRelatedOnly: boolean): CitedPage => ({
  label: source.kind === 'wcag' ? `WCAG ${source.sc}` : sourceLabels[source.kind],
  title: source.title.replace(/^Understanding SC [\d.]+:\s*/, ''),
  url: source.url,
  isRelatedOnly,
});

/**
 * A rule applies a page unless the citation says it is only related or rationale. A note alone
 * does not: it may just tell where on the page to look, as for an APG example menu button cites.
 */
const isApplied = ({ relation }: Source) => relation === undefined;

function citedPages(sources: readonly Source[]): CitedPage[] {
  const byUrl = new Map(sources.map((source) => [source.url, source]));
  // One citation that applies the page is enough.
  const applied = new Set(sources.filter(isApplied).map(({ url }) => url));
  return [...byUrl.values()].map((source) => citedPage(source, !applied.has(source.url)));
}

function ruleTotals(patterns: readonly Pattern[]): MethodTotals['rules'] {
  const rules = patterns.flatMap((pattern) => pattern.rules);
  const fromStandards = rules.filter((rule) => rule.level === 'rule').length;
  return {
    total: rules.length,
    fromStandards,
    recommendations: rules.length - fromStandards,
    cited: citedPages(rules.flatMap((rule) => rule.sources)),
  };
}

function recordingTotals(measurements: readonly Measurement[]): MethodTotals['recording'] {
  const steps = measurements.flatMap(recordedSteps);
  return {
    steps: steps.length,
    focusMoved: steps.filter(hasFocusMoved).length,
    treeChanged: steps.filter(hasTreeChanged).length,
    announced: steps.filter((step) => step.announcements.length > 0).length,
  };
}

function verdictTotals(sources: readonly MethodSource[]): MethodTotals['verdicts'] {
  const perRule = sources.flatMap(({ pattern, measurements, notCounted }) =>
    pattern.rules.map((rule) => ({
      ...ruleAgreement(rule.id, measurements, notCounted),
      level: rule.level,
    })),
  );
  const sum = (pick: (agreement: (typeof perRule)[number]) => number) =>
    perRule.reduce((total, agreement) => total + pick(agreement), 0);
  return {
    total: sum((a) => a.measured),
    follows: sum((a) => a.follows),
    differs: sum((a) => a.differs),
    differsFromStandards: sum((a) => (a.level === 'rule' ? a.differs : 0)),
    inconclusive: sum((a) => a.inconclusive),
    notApplicable: sum((a) => a.notApplicable),
  };
}

/**
 * What the method has produced so far, counted across every measured pattern: the home page
 * explains the method with these, so it speaks for all patterns and not for one key of one.
 * Recordings and verdicts both come from the counted design systems, the ones the pattern pages
 * count agreement from: with the reference and the systems set aside included, the recording
 * counts described more systems than the verdicts beside them (verdict audit 2026-11-14).
 * A pattern with no counted measurement adds nothing, its rules included.
 */
export function methodTotals(all: readonly MethodSource[]): MethodTotals {
  const sources = all
    .map((source) => ({
      ...source,
      measurements: source.measurements.filter(
        (m) => isMeasured(m) && !isReference(m) && !source.notCounted.has(m.target.adapter),
      ),
    }))
    .filter(({ measurements }) => measurements.length > 0);
  const counted = sources.flatMap((source) => source.measurements);
  const provenances = counted.flatMap(({ provenance }) =>
    provenance.status === 'measured' ? [provenance] : [],
  );
  const runs = new Set(provenances.map((provenance) => provenance.runs));
  return {
    patterns: sources.map(({ pattern, measurements }) => ({
      name: pattern.name,
      rules: pattern.rules.length,
      systems: measurements.length,
    })),
    systems: new Set(counted.map(({ target }) => target.system)).size,
    runs: runs.size === 1 ? [...runs][0] : undefined,
    latest: provenances
      .map(({ measuredAt }) => measuredAt)
      .sort()
      .at(-1),
    rules: ruleTotals(sources.map(({ pattern }) => pattern)),
    recording: recordingTotals(counted),
    verdicts: verdictTotals(sources),
  };
}
