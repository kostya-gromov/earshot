import type { RawAxNode } from '../../src/model/raw-ax.ts';

/*
 * AX nodes shaped like real Chromium CDP output for the reference chip field (captured with
 * Accessibility.getPartialAXTree on 2026-10-31). Object Mother: valid by default, override
 * one thing per test.
 */

let nextId = 100;

export function axNode(role: string, overrides: Partial<RawAxNode> = {}): RawAxNode {
  const id = String(nextId++);
  return {
    nodeId: id,
    ignored: false,
    role: { type: 'role', value: role },
    name: { type: 'computedString', value: '' },
    backendDOMNodeId: Number(id),
    ...overrides,
  };
}

export const named = (name: string) => ({ name: { type: 'computedString', value: name } });

/** list > 3 × (listitem > StaticText + button), like the reference's chips. */
export function chipList() {
  const list = axNode('list', named('Selected people'));
  const items = ['Irene Oh', 'Greg Fisher', 'Hiroshi Matsui'].map((person) => {
    const item = axNode('listitem', { parentId: list.nodeId });
    const text = axNode('StaticText', { ...named(person), parentId: item.nodeId });
    const button = axNode('button', { ...named(`Remove ${person}`), parentId: item.nodeId });
    item.childIds = [text.nodeId, button.nodeId];
    return { item, text, button };
  });
  list.childIds = items.map(({ item }) => item.nodeId);
  return {
    list,
    items,
    all: [list, ...items.flatMap(({ item, text, button }) => [item, text, button])],
  };
}
