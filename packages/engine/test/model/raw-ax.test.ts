import { describe, expect, it } from 'vitest';
import { toAccessibleNode } from '../../src/model/raw-ax.ts';
import { axNode, named } from './fixtures.ts';

const prop = (name: string, type: string, value: unknown) => ({ name, value: { type, value } });

describe('toAccessibleNode', () => {
  it('maps role, name and the states Chromium reports', () => {
    const combobox = axNode('combobox', {
      ...named('To'),
      properties: [
        prop('invalid', 'token', 'false'),
        prop('focusable', 'booleanOrUndefined', true),
        prop('expanded', 'booleanOrUndefined', true),
        prop('hasPopup', 'token', 'listbox'),
      ],
    });
    expect(toAccessibleNode(combobox)).toEqual({
      role: 'combobox',
      name: 'To',
      states: { expanded: true, invalid: false },
    });
  });

  it('reads tristate checked and invalid tokens', () => {
    const box = axNode('checkbox', {
      properties: [prop('checked', 'tristate', 'mixed'), prop('invalid', 'token', 'spelling')],
    });
    expect(toAccessibleNode(box).states).toEqual({ checked: 'mixed', invalid: true });
  });

  it('keeps a description only when there is one', () => {
    const plain = axNode('button', named('Remove Irene Oh'));
    const described = axNode('button', { description: { type: 'computedString', value: 'Hint' } });
    expect(toAccessibleNode(plain)).not.toHaveProperty('description');
    expect(toAccessibleNode(described).description).toBe('Hint');
  });

  it('reports a missing role as null rather than guessing', () => {
    const { role: _, ...noRole } = axNode('button');
    expect(toAccessibleNode(noRole).role).toBeNull();
  });
});
