/**
 * Which measured systems sit next to the reference in the comparison. Kept in the URL
 * (`?compare=mui,react-aria`) so a comparison can be shared. Pure, no DOM.
 */

/** Reference plus three columns still reads on a laptop; more turns the table into a wall. */
export const maxCompared = 3;

interface ParseOptions {
  available: readonly string[];
  fallback: readonly string[];
}

export function parseCompared(query: string | null, { available, fallback }: ParseOptions) {
  const known = [...new Set((query ?? '').split(','))].filter((id) => available.includes(id));
  return known.length > 0 ? known.slice(0, maxCompared) : [...fallback];
}

export function toggleCompared(selected: readonly string[], id: string): readonly string[] {
  if (selected.includes(id)) return selected.filter((item) => item !== id);
  if (selected.length >= maxCompared) return selected;
  return [...selected, id];
}

export const serializeCompared = (selected: readonly string[]): string => selected.join(',');

export interface ComparisonCandidate {
  id: string;
  follows: number;
  differs: number;
  /** Deprecated systems are shown but not counted, so they are never the first view. */
  isCounted: boolean;
  /** A model trade-off explains its differences (ADR 0006 review, 2026-11-09). */
  hasModel: boolean;
}

/**
 * The first view: the system closest to the reference, so a reader sees the rules can be met,
 * next to the one that differs most, preferring a difference a model trade-off explains.
 * Ties keep the candidates' order.
 */
export function defaultComparison(candidates: readonly ComparisonCandidate[]): string[] {
  const counted = candidates.filter(({ isCounted }) => isCounted);
  const best = (score: (c: ComparisonCandidate) => number, pool: readonly ComparisonCandidate[]) =>
    pool.reduce<ComparisonCandidate | undefined>(
      (top, c) => (top === undefined || score(c) > score(top) ? c : top),
      undefined,
    );
  const closest = best(({ follows }) => follows, counted);
  const rest = counted.filter(({ id }) => id !== closest?.id);
  const furthest = best(({ differs, hasModel }) => differs * 2 + (hasModel ? 1 : 0), rest);
  return [closest, furthest].flatMap((c) => (c ? [c.id] : []));
}
