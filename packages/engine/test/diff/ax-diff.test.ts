import { describe, expect, test } from 'vitest';
import { diffAxTrees } from '../../src/diff/index.ts';
import { axEntry } from './fixtures.ts';

describe('diffAxTrees', () => {
  test('returns an empty diff for identical trees', () => {
    const tree = [axEntry('button', 'Save')];

    expect(diffAxTrees(tree, tree)).toEqual({ added: [], removed: [], changed: [] });
  });

  test('reports inserted and removed nodes in source order', () => {
    const before = [axEntry('button', 'Remove'), axEntry('button', 'Keep')];
    const after = [axEntry('button', 'Keep'), axEntry('option', 'Added')];

    expect(diffAxTrees(before, after)).toEqual({
      added: [{ role: 'option', name: 'Added' }],
      removed: [{ role: 'button', name: 'Remove' }],
      changed: [],
    });
  });

  test('reports a node removed from the suffix', () => {
    const before = [axEntry('button', 'Keep'), axEntry('StaticText', 'Gone')];
    const after = [axEntry('button', 'Keep')];

    expect(diffAxTrees(before, after).removed).toEqual([{ role: 'StaticText', name: 'Gone' }]);
  });

  test('reports a matched property changing from false to true', () => {
    const before = [axEntry('combobox', 'People', { props: { expanded: false } })];
    const after = [axEntry('combobox', 'People', { props: { expanded: true } })];

    expect(diffAxTrees(before, after).changed).toEqual([
      {
        node: { role: 'combobox', name: 'People' },
        property: 'expanded',
        before: false,
        after: true,
      },
    ]);
  });

  test('represents a missing property as null', () => {
    const before = [axEntry('option', 'Irene')];
    const after = [axEntry('option', 'Irene', { props: { selected: true } })];

    expect(diffAxTrees(before, after).changed).toEqual([
      {
        node: { role: 'option', name: 'Irene' },
        property: 'selected',
        before: null,
        after: true,
      },
    ]);
  });

  test('pairs a rename inside the same anchors when role and depth match', () => {
    const before = [
      axEntry('listitem', 'Start'),
      axEntry('button', 'Old', { depth: 1 }),
      axEntry('listitem', 'End'),
    ];
    const after = [
      axEntry('listitem', 'Start'),
      axEntry('button', 'New', { depth: 1 }),
      axEntry('listitem', 'End'),
    ];

    expect(diffAxTrees(before, after)).toEqual({
      added: [],
      removed: [],
      changed: [
        {
          node: { role: 'button', name: 'New' },
          property: 'name',
          before: 'Old',
          after: 'New',
        },
      ],
    });
  });

  test.each([
    {
      label: 'role',
      before: axEntry('button', 'Old', { depth: 1 }),
      after: axEntry('option', 'New', { depth: 1 }),
    },
    {
      label: 'depth',
      before: axEntry('button', 'Old', { depth: 1 }),
      after: axEntry('button', 'New', { depth: 2 }),
    },
  ])('does not rename nodes with a different $label', ({ before, after }) => {
    expect(diffAxTrees([before], [after])).toEqual({
      added: [{ role: after.role, name: after.name }],
      removed: [{ role: before.role, name: before.name }],
      changed: [],
    });
  });

  test('matches semantically equal entries without DOM identity', () => {
    const before = [axEntry('button', 'Save', { props: { disabled: false } })];
    const after = [axEntry('button', 'Save', { props: { disabled: false } })];

    expect(before[0]).not.toBe(after[0]);
    expect(diffAxTrees(before, after)).toEqual({ added: [], removed: [], changed: [] });
  });

  test('never emits equal names as a no-op rename', () => {
    const before = [axEntry('button', 'Same', { depth: 0 })];
    const after = [axEntry('button', 'Same', { depth: 1 })];

    expect(diffAxTrees(before, after)).toEqual({
      added: [{ role: 'button', name: 'Same' }],
      removed: [{ role: 'button', name: 'Same' }],
      changed: [],
    });
  });

  test('does not guess a rename when role and depth have multiple candidates', () => {
    const before = [axEntry('button', 'Old one'), axEntry('button', 'Old two')];
    const after = [axEntry('button', 'New')];

    expect(diffAxTrees(before, after)).toEqual({
      added: [{ role: 'button', name: 'New' }],
      removed: [
        { role: 'button', name: 'Old one' },
        { role: 'button', name: 'Old two' },
      ],
      changed: [],
    });
  });
});
