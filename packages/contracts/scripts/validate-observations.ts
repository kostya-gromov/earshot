/**
 * Every observation labelled `recorded` must lead to a measurement file a reader can open: the
 * system's own, or a variant of it, dated like the note. And a variant must belong to a counted
 * system of the same pattern and say why it is not counted (ADR 0005, amendment of 2026-11-16).
 * And a note that names the rules it concerns names rules its pattern has.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  measurementOf,
  patterns,
  patternsInProgress,
  type MeasuredEntry,
  type TargetEntry,
} from '../src/index.ts';

const isMeasured = (entry: TargetEntry): entry is MeasuredEntry => entry.status === 'measured';

/** The day a measurement was taken, as its file says; undefined when the file cannot be read. */
async function measuredDay(file: string): Promise<string | undefined> {
  try {
    const raw = JSON.parse(await readFile(file, 'utf8')) as {
      provenance?: { measuredAt?: unknown };
    };
    const at = raw.provenance?.measuredAt;
    return typeof at === 'string' ? at.slice(0, 10) : undefined;
  } catch {
    return undefined;
  }
}

function variantProblems(patternId: string, entries: readonly MeasuredEntry[]): string[] {
  const counted = new Set(entries.filter((e) => !e['variant-of']).map(({ adapter }) => adapter));
  return entries.flatMap((entry) => {
    const parent = entry['variant-of'];
    if (parent === undefined) return [];
    const where = `${patternId}: variant "${entry.adapter}"`;
    return [
      ...(counted.has(parent) ? [] : [`${where} names "${parent}", which is not a counted entry`]),
      ...(entry['not-counted'] ? [] : [`${where} must say why it is not counted`]),
    ];
  });
}

/** The adapters a system's notes may cite: its own, and the variants that belong to it. */
const citable = (entry: MeasuredEntry, entries: readonly MeasuredEntry[]): Set<string> =>
  new Set([
    entry.adapter,
    ...entries.filter((e) => e['variant-of'] === entry.adapter).map(({ adapter }) => adapter),
  ]);

interface Pattern {
  id: string;
  dir: string;
}

async function recordedProblems(
  pattern: Pattern,
  entry: MeasuredEntry,
  entries: readonly MeasuredEntry[],
): Promise<string[]> {
  const problems: string[] = [];
  const allowed = citable(entry, entries);
  for (const observation of entry.observations ?? []) {
    if (observation.source !== 'recorded') continue;
    const adapter = measurementOf(entry, observation);
    const where = `${pattern.id}: ${entry.system}, recorded note of ${observation.date}`;
    if (!allowed.has(adapter)) {
      problems.push(`${where} cites "${adapter}", which is neither its own nor its variant`);
      continue;
    }
    const day = await measuredDay(join(pattern.dir, `${adapter}.json`));
    if (day === undefined) problems.push(`${where} cites ${adapter}.json, which cannot be read`);
    else if (day !== observation.date) {
      problems.push(`${where} cites ${adapter}.json, which was measured on ${day}`);
    }
  }
  return problems;
}

/** A note shown under rules the pattern does not have would be shown nowhere, silently. */
function ruleProblems(patternId: string, entries: readonly MeasuredEntry[]): string[] {
  const pattern = patterns[patternId] ?? patternsInProgress[patternId];
  const known = new Set(pattern?.rules.map(({ id }) => id));
  return entries.flatMap((entry) =>
    (entry.observations ?? []).flatMap(({ rules = [], date }) =>
      rules
        .filter((rule) => !known.has(rule))
        .map(
          (rule) =>
            `${patternId}: ${entry.system}, note of ${date} names the rule "${rule}", which the pattern does not have`,
        ),
    ),
  );
}

export async function validateObservations(
  measurementsDir: string,
  targets: Readonly<Record<string, readonly TargetEntry[]>>,
): Promise<string[]> {
  const problems: string[] = [];
  for (const [id, all] of Object.entries(targets)) {
    const entries = all.filter(isMeasured);
    problems.push(...variantProblems(id, entries), ...ruleProblems(id, entries));
    const pattern = { id, dir: join(measurementsDir, id) };
    for (const entry of entries) {
      problems.push(...(await recordedProblems(pattern, entry, entries)));
    }
  }
  return problems;
}
