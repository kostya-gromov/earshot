import { describe, expect, it } from 'vitest';
import { formatNodeSpeech } from '../../src/speech/format-node.ts';

describe('formatNodeSpeech', () => {
  it('formats name, role and position', () => {
    expect(
      formatNodeSpeech({
        role: 'button',
        name: 'Remove Hiroshi Matsui',
        posInSet: 3,
        setSize: 3,
        states: {},
      }),
    ).toBe('Remove Hiroshi Matsui, button, 3 of 3');
  });

  it('omits missing parts without empty separators', () => {
    expect(formatNodeSpeech({ role: null, name: '', states: {} })).toBe('');
    expect(formatNodeSpeech({ role: 'button', name: '', posInSet: 2, states: {} })).toBe('button');
  });

  it('formats states in a fixed order', () => {
    expect(
      formatNodeSpeech({
        role: 'option',
        name: 'Two',
        states: {
          expanded: true,
          selected: true,
          checked: 'mixed',
          disabled: true,
          invalid: true,
        },
      }),
    ).toBe('Two, option, expanded, selected, mixed, unavailable, invalid entry');
  });

  it.each([
    [{ expanded: false }, 'collapsed'],
    [{ checked: true }, 'checked'],
    [{ checked: false }, 'not checked'],
    [{ checked: 'mixed' as const }, 'mixed'],
  ])('formats state %j as %s', (states, expected) => {
    expect(formatNodeSpeech({ role: null, name: '', states })).toBe(expected);
  });

  it('omits false selected, disabled and invalid states', () => {
    expect(
      formatNodeSpeech({
        role: 'option',
        name: 'Two',
        states: { selected: false, disabled: false, invalid: false },
      }),
    ).toBe('Two, option');
  });

  it('says the popup an element has after its role, before its states', () => {
    const button = {
      role: 'button',
      name: 'Actions',
      states: { expanded: false, hasPopup: 'menu' },
    };
    expect(formatNodeSpeech(button as never)).toBe('Actions, button, has popup menu, collapsed');
  });
});
