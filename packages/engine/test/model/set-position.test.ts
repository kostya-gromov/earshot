import { describe, expect, it } from 'vitest';
import { ancestorChain, findSetItem, positionAmong } from '../../src/model/set-position.ts';
import { axNode, chipList } from './fixtures.ts';

describe('set position', () => {
  it('finds the list item above a focused remove button', () => {
    const { all, items } = chipList();
    const { button, item } = items[2]!;
    expect(findSetItem(ancestorChain(all, button))).toBe(item);
  });

  it('counts the item among siblings with the same role: "3 of 3"', () => {
    const { all, items } = chipList();
    expect(positionAmong(all, items[2]!.item)).toEqual({ posInSet: 3, setSize: 3 });
    expect(positionAmong(all, items[0]!.item)).toEqual({ posInSet: 1, setSize: 3 });
  });

  it('skips ignored siblings and siblings with another role', () => {
    const { list, items, all } = chipList();
    const ignored = axNode('listitem', { ignored: true, parentId: list.nodeId });
    const separator = axNode('separator', { parentId: list.nodeId });
    list.childIds = [ignored.nodeId, ...list.childIds!, separator.nodeId];
    expect(positionAmong([...all, ignored, separator], items[1]!.item)).toEqual({
      posInSet: 2,
      setSize: 3,
    });
  });

  it('has no position when nothing above is a set item', () => {
    const main = axNode('main');
    const button = axNode('button', { parentId: main.nodeId });
    expect(findSetItem(ancestorChain([main, button], button))).toBeUndefined();
  });

  it('has no position when the parent is not known', () => {
    const orphan = axNode('listitem', { parentId: 'missing' });
    expect(positionAmong([orphan], orphan)).toBeUndefined();
  });
});
