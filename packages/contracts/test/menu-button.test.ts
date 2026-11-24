import { describe, expect, it } from 'vitest';
import { menuButton, patterns, patternsInProgress } from '../src/index.ts';

describe('menu button pattern', () => {
  it('has a page on the site: it is in `patterns`, no longer in progress', () => {
    expect(patterns[menuButton.id]).toBe(menuButton);
    expect(patternsInProgress[menuButton.id]).toBeUndefined();
  });

  it('is listed third, after the patterns measured before it', () => {
    expect(Object.keys(patterns)).toEqual([
      'input-with-chips',
      'combobox',
      'menu-button',
      'tabs',
      'dialog',
    ]);
  });

  it('has nine rules, two of them Earshot recommendations', () => {
    expect(menuButton.rules).toHaveLength(9);
    expect(menuButton.rules.filter((rule) => rule.level === 'recommendation')).toHaveLength(2);
  });
});
