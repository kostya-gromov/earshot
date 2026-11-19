import { AxDiff, type AxDiff as AxDiffResult } from '@earshot/contracts';
import fc from 'fast-check';
import { expect, test } from 'vitest';
import { diffAxTrees } from '../../src/diff/index.ts';
import type { AxEntry, AxPropValue } from '../../src/model/ax-tree.ts';

type AccessibleRef = AxDiffResult['added'][number];

const role = fc.constantFrom('button', 'listitem', 'option', 'combobox', 'StaticText');
const name = fc.string({ minLength: 1, maxLength: 8 }).filter((value) => value.trim().length > 0);
const propertyValue: fc.Arbitrary<AxPropValue> = fc.oneof(
  fc.boolean(),
  fc.integer({ min: 0, max: 10 }),
  fc.string({ maxLength: 8 }),
  fc.constant(null),
);
const props = fc.dictionary(
  fc.constantFrom('expanded', 'selected', 'checked', 'disabled', 'level', 'value'),
  propertyValue,
  { maxKeys: 4 },
);
const entry: fc.Arbitrary<AxEntry> = fc.record({
  role,
  name,
  depth: fc.integer({ min: 0, max: 3 }),
  props,
});
const tree = fc.array(entry, { maxLength: 20 });

function keyOf(ref: AccessibleRef): string {
  return `${ref.role ?? ''}\u0000${ref.name}`;
}

function multisetOf(entries: readonly AccessibleRef[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) counts.set(keyOf(entry), (counts.get(keyOf(entry)) ?? 0) + 1);
  return counts;
}

function removeOne(counts: Map<string, number>, ref: AccessibleRef): void {
  const key = keyOf(ref);
  const count = counts.get(key) ?? 0;
  if (count <= 1) counts.delete(key);
  else counts.set(key, count - 1);
}

function addOne(counts: Map<string, number>, ref: AccessibleRef): void {
  const key = keyOf(ref);
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function applyStructuralDiff(before: readonly AxEntry[], diff: AxDiffResult): Map<string, number> {
  const result = multisetOf(before);
  for (const removed of diff.removed) removeOne(result, removed);
  for (const change of diff.changed) {
    if (change.property !== 'name' || typeof change.before !== 'string') continue;
    removeOne(result, { role: change.node.role, name: change.before });
    addOne(result, change.node);
  }
  for (const added of diff.added) addOne(result, added);
  return result;
}

test('diffing a tree with itself is empty', () => {
  fc.assert(
    fc.property(tree, (value) => {
      expect(diffAxTrees(value, value)).toEqual({ added: [], removed: [], changed: [] });
    }),
    { numRuns: 200 },
  );
});

test('structural changes reconstruct the after role-name multiset', () => {
  fc.assert(
    fc.property(tree, tree, (before, after) => {
      const diff = diffAxTrees(before, after);

      expect(applyStructuralDiff(before, diff)).toEqual(multisetOf(after));
    }),
    { numRuns: 200 },
  );
});

test('every generated diff satisfies the AxDiff schema', () => {
  fc.assert(
    fc.property(tree, tree, (before, after) => {
      expect(() => AxDiff.parse(diffAxTrees(before, after))).not.toThrow();
    }),
    { numRuns: 200 },
  );
});
