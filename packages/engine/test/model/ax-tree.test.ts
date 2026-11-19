import { describe, expect, it } from 'vitest';
import { flattenSubtree } from '../../src/model/ax-tree.ts';
import { axNode, chipList, named } from './fixtures.ts';

describe('flattenSubtree', () => {
  it('lists the component subtree in pre-order with depth', () => {
    const { list, all } = chipList();
    const entries = flattenSubtree(all, list.backendDOMNodeId!);
    expect(entries.slice(0, 4).map(({ role, name, depth }) => [depth, role, name])).toEqual([
      [0, 'list', 'Selected people'],
      [1, 'listitem', ''],
      [2, 'StaticText', 'Irene Oh'],
      [2, 'button', 'Remove Irene Oh'],
    ]);
    expect(entries).toHaveLength(10);
  });

  it('skips ignored and unnamed generic wrappers but keeps their children', () => {
    const root = axNode('group', named('Field'));
    const wrapper = axNode('generic', { parentId: root.nodeId });
    const hidden = axNode('none', { ignored: true, parentId: wrapper.nodeId });
    const button = axNode('button', { ...named('Send'), parentId: hidden.nodeId });
    root.childIds = [wrapper.nodeId];
    wrapper.childIds = [hidden.nodeId];
    hidden.childIds = [button.nodeId];

    const entries = flattenSubtree([root, wrapper, hidden, button], root.backendDOMNodeId!);
    expect(entries.map(({ role, depth }) => [depth, role])).toEqual([
      [0, 'group'],
      [1, 'button'],
    ]);
  });

  it('drops layout-only text fragments', () => {
    const text = axNode('StaticText', named('Irene Oh'));
    const box = axNode('InlineTextBox', { ...named('Irene Oh'), parentId: text.nodeId });
    text.childIds = [box.nodeId];
    expect(flattenSubtree([text, box], text.backendDOMNodeId!)).toHaveLength(1);
  });

  it('records perceivable properties and the value', () => {
    const input = axNode('combobox', {
      ...named('To'),
      value: { type: 'string', value: 'an' },
      properties: [
        { name: 'expanded', value: { type: 'booleanOrUndefined', value: true } },
        { name: 'focused', value: { type: 'booleanOrUndefined', value: true } },
      ],
    });
    expect(flattenSubtree([input], input.backendDOMNodeId!)[0]?.props).toEqual({
      expanded: true,
      value: 'an',
    });
  });

  it('returns nothing when the root is not in the tree', () => {
    expect(flattenSubtree([axNode('list')], -1)).toEqual([]);
  });
});
