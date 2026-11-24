import type { Pattern, Rule, Source } from '@earshot/contracts';

/** One page of WCAG or APG, with how many rules rest on it across the patterns. */
export interface CitedPage {
  url: string;
  kind: Source['kind'];
  label: string;
  /** Rules from the standards (level `rule`) that apply the page directly. */
  applied: number;
  /** Rules from the standards that cite it only as related or as rationale. */
  related: number;
  /**
   * Earshot recommendations that cite it, however they cite it: a recommendation is advice beyond
   * the standards, so it never counts as applying one (verdict audit, 2026-11-18).
   */
  recommendations: number;
  /** Names of the patterns whose rules cite it, in the patterns' order. */
  patterns: readonly string[];
}

/** A page, whatever part of it a rule points at. */
const pageOf = (url: string): string => url.split('#')[0] ?? url;

function labelOf(source: Source): string {
  switch (source.kind) {
    case 'wcag':
      return `WCAG ${source.sc} ${source.title.replace(/^Understanding SC [\d.]+:\s*/, '')}`;
    case 'apg':
      // "Combobox Pattern: keyboard interaction" names the page before its colon.
      return `APG: ${source.title.split(':')[0]}`;
    case 'other':
      return source.title;
  }
}

interface Tally {
  source: Source;
  applied: Set<string>;
  related: Set<string>;
  recommendations: Set<string>;
  patterns: Set<string>;
}

const newTally = (source: Source): Tally => ({
  source,
  applied: new Set<string>(),
  related: new Set<string>(),
  recommendations: new Set<string>(),
  patterns: new Set<string>(),
});

/** Where one citation of a page by one rule is counted. */
function bucketOf(tally: Tally, rule: Rule, source: Source): Set<string> {
  if (rule.level === 'recommendation') return tally.recommendations;
  return source.relation === undefined ? tally.applied : tally.related;
}

const kindOrder: Readonly<Record<Source['kind'], number>> = { apg: 0, wcag: 1, other: 2 };

/**
 * Every page the rules of these patterns cite, counted by rule: a rule that points at two
 * parts of one page counts once, and one that applies a page is not also counted as citing it
 * as related. Requirements for design are not counted here: this is about measured behavior.
 */
export function citedPages(patterns: readonly Pattern[]): CitedPage[] {
  const tallies = new Map<string, Tally>();
  for (const pattern of patterns) {
    for (const rule of pattern.rules) {
      for (const source of rule.sources) {
        const url = pageOf(source.url);
        const tally = tallies.get(url) ?? newTally(source);
        bucketOf(tally, rule, source).add(`${pattern.id}:${rule.id}`);
        tally.patterns.add(pattern.name);
        tallies.set(url, tally);
      }
    }
  }
  return [...tallies.entries()]
    .map(([url, { source, applied, related, recommendations, patterns: cited }]) => ({
      url,
      kind: source.kind,
      label: labelOf(source),
      applied: applied.size,
      related: [...related].filter((rule) => !applied.has(rule)).length,
      recommendations: recommendations.size,
      patterns: [...cited],
    }))
    .sort(
      (a, b) =>
        kindOrder[a.kind] - kindOrder[b.kind] ||
        b.applied - a.applied ||
        a.label.localeCompare(b.label, 'en', { numeric: true }),
    );
}

/** How many of the patterns' rules come from the standards, and how many Earshot adds. */
export function ruleLevels(patterns: readonly Pattern[]): {
  rules: number;
  recommendations: number;
} {
  const levels = patterns.flatMap(({ rules }) => rules.map(({ level }) => level));
  return {
    rules: levels.filter((level) => level === 'rule').length,
    recommendations: levels.filter((level) => level === 'recommendation').length,
  };
}
