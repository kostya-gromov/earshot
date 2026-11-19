import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Measurement } from '@earshot/contracts';
import { behaviorContract } from '../../src/lib/behavior-contract';

// Built from the engine's own file: the contract is what the reference was recorded doing.
const folder = path.join(import.meta.dirname, '../../../../data', 'measurements', 'menu-button');
const reference = Measurement.parse(
  JSON.parse(readFileSync(path.join(folder, 'reference.json'), 'utf8')),
);
const lines = behaviorContract(reference).map((line) => line.map(({ text }) => text).join(''));
const scenario = (id: string) => {
  const start = lines.findIndex((line) => line.startsWith(`scenario ${id} `));
  return lines.slice(start + 1, lines.indexOf('', start)).map((line) => line.trim());
};

describe('the behavior contract of a menu button', () => {
  it('does not say that focus stays in the field: focus moves into the menu', () => {
    expect(lines.some((line) => line.includes('focus stays in the field'))).toBe(false);
  });

  it('says which item is active after every key, and that one is disabled', () => {
    expect(scenario('disabled')).toEqual([
      'press Enter                 → menu open, active “Rename”, 1 of 4',
      'press ArrowDown             → menu open, active “Duplicate”, 2 of 4',
      'press ArrowDown             → menu open, active “Archive”, 3 of 4, disabled',
      'press Enter                 → menu open, active “Archive”, 3 of 4, disabled',
    ]);
  });

  it('says where focus is once the menu is closed, and what the page says ran', () => {
    expect(scenario('activate').at(-1)).toBe(
      'press Enter                 → menu closed, focus on the button, page says “Last action: Duplicate”',
    );
    expect(scenario('escape').at(-1)).toBe(
      'press Escape                → menu closed, focus on the button',
    );
    expect(scenario('tab-open').at(-1)).toBe(
      'press Tab                   → menu closed, focus leaves to “Note”',
    );
  });

  it('gives the active item the focus colour', () => {
    const colored = behaviorContract(reference)
      .flat()
      .filter(({ kind }) => kind === 'focus')
      .map(({ text }) => text);
    expect(colored).toContain('“Rename”');
  });
});
