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

  it('keeps the value the tree gives a combobox: a select’s chosen option', () => {
    const select = axNode('combobox', {
      ...named('Fruit'),
      value: { type: 'string', value: 'Banana' },
    });
    expect(toAccessibleNode(select)).toEqual({
      role: 'combobox',
      name: 'Fruit',
      treeValue: 'Banana',
      states: {},
    });
  });

  it('keeps an empty combobox value, which says nothing is chosen', () => {
    const empty = axNode('combobox', { value: { type: 'string', value: '' } });
    expect(toAccessibleNode(empty).treeValue).toBe('');
  });

  it('reads no value for other roles, so their records do not change', () => {
    const field = axNode('textbox', { value: { type: 'string', value: 'Ada' } });
    const button = axNode('button', named('Fruit Banana'));
    expect(toAccessibleNode(field)).not.toHaveProperty('treeValue');
    expect(toAccessibleNode(button)).not.toHaveProperty('treeValue');
  });
});
