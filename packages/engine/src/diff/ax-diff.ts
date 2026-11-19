import type { AxDiff } from '@earshot/contracts';
import type { AxEntry } from '../model/ax-tree.ts';
import { longestCommonSubsequence, type LcsPair } from './lcs.ts';

type AccessibleRef = AxDiff['added'][number];
type AxChange = AxDiff['changed'][number];

interface IndexedEntry {
  entry: AxEntry;
  index: number;
}

interface EntryPair {
  before: IndexedEntry;
  after: IndexedEntry;
  isRename: boolean;
}

interface IndexedChange {
  change: AxChange;
  afterIndex: number;
}

const semanticKey = (entry: AxEntry) => `${entry.depth}\u0000${entry.role}\u0000${entry.name}`;

const accessibleRef = (entry: AxEntry): AccessibleRef => ({
  role: entry.role,
  name: entry.name,
});

function pairGap(before: readonly IndexedEntry[], after: readonly IndexedEntry[]): EntryPair[] {
  const pairs: EntryPair[] = [];
  for (const beforeItem of before) {
    const candidates = after.filter(
      ({ entry }) =>
        entry.role === beforeItem.entry.role &&
        entry.depth === beforeItem.entry.depth &&
        entry.name !== beforeItem.entry.name,
    );
    if (candidates.length !== 1) continue;
    const afterItem = candidates[0]!;
    const reverseCandidates = before.filter(
      ({ entry }) =>
        entry.role === afterItem.entry.role &&
        entry.depth === afterItem.entry.depth &&
        entry.name !== afterItem.entry.name,
    );
    if (reverseCandidates.length !== 1) continue;
    pairs.push({ before: beforeItem, after: afterItem, isRename: true });
  }
  return pairs;
}

function entriesBetween(entries: readonly AxEntry[], start: number, end: number): IndexedEntry[] {
  return entries.slice(start, end).map((entry, offset) => ({ entry, index: start + offset }));
}

function pairEntries(
  before: readonly AxEntry[],
  after: readonly AxEntry[],
  lcsPairs: readonly LcsPair[],
): EntryPair[] {
  const pairs: EntryPair[] = [];
  let beforeStart = 0;
  let afterStart = 0;

  for (const lcsPair of [...lcsPairs, { beforeIndex: before.length, afterIndex: after.length }]) {
    pairs.push(
      ...pairGap(
        entriesBetween(before, beforeStart, lcsPair.beforeIndex),
        entriesBetween(after, afterStart, lcsPair.afterIndex),
      ),
    );
    if (lcsPair.beforeIndex < before.length) {
      pairs.push({
        before: { entry: before[lcsPair.beforeIndex]!, index: lcsPair.beforeIndex },
        after: { entry: after[lcsPair.afterIndex]!, index: lcsPair.afterIndex },
        isRename: false,
      });
    }
    beforeStart = lcsPair.beforeIndex + 1;
    afterStart = lcsPair.afterIndex + 1;
  }
  return pairs;
}

function propertyChanges(pair: EntryPair): IndexedChange[] {
  const changes: IndexedChange[] = [];
  if (pair.isRename) {
    changes.push({
      afterIndex: pair.after.index,
      change: {
        node: accessibleRef(pair.after.entry),
        property: 'name',
        before: pair.before.entry.name,
        after: pair.after.entry.name,
      },
    });
  }

  const keys = new Set([
    ...Object.keys(pair.before.entry.props),
    ...Object.keys(pair.after.entry.props),
  ]);
  keys.delete('name');
  for (const property of [...keys].sort()) {
    const beforeValue = pair.before.entry.props[property] ?? null;
    const afterValue = pair.after.entry.props[property] ?? null;
    if (beforeValue === afterValue) continue;
    changes.push({
      afterIndex: pair.after.index,
      change: {
        node: accessibleRef(pair.after.entry),
        property,
        before: beforeValue,
        after: afterValue,
      },
    });
  }
  return changes;
}

function unpairedRefs(entries: readonly AxEntry[], paired: Set<number>): AccessibleRef[] {
  return entries.filter((_, index) => !paired.has(index)).map(accessibleRef);
}

export function diffAxTrees(before: readonly AxEntry[], after: readonly AxEntry[]): AxDiff {
  const lcsPairs = longestCommonSubsequence(before.map(semanticKey), after.map(semanticKey));
  const pairs = pairEntries(before, after, lcsPairs);
  const pairedBefore = new Set(pairs.map((pair) => pair.before.index));
  const pairedAfter = new Set(pairs.map((pair) => pair.after.index));
  const changed = pairs
    .flatMap(propertyChanges)
    .sort(
      (left, right) =>
        left.afterIndex - right.afterIndex ||
        left.change.property.localeCompare(right.change.property),
    )
    .map(({ change }) => change);

  return {
    added: unpairedRefs(after, pairedAfter),
    removed: unpairedRefs(before, pairedBefore),
    changed,
  };
}
