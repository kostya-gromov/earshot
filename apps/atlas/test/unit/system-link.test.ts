import { describe, expect, it } from 'vitest';
import { publicRepository } from '../../src/lib/correction-link';
import { systemSuggestionLink } from '../../src/lib/system-link';

const paramsOf = (link: string) => new URL(link).searchParams;

describe('systemSuggestionLink', () => {
  it('opens the system form on the public repository', () => {
    const link = systemSuggestionLink('combobox');
    expect(link.startsWith(`${publicRepository}/issues/new?`)).toBe(true);
    expect(paramsOf(link).get('template')).toBe('system.yml');
  });

  it('names the pattern in the title and leaves the system for the person to add', () => {
    expect(paramsOf(systemSuggestionLink('combobox')).get('title')).toBe('System for combobox: ');
  });

  it('fills the pattern field of the form', () => {
    expect(paramsOf(systemSuggestionLink('menu-button')).get('pattern')).toBe('menu-button');
  });
});
