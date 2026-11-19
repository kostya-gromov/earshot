import { patterns, type Pattern } from '@earshot/contracts';
import { plannedPatterns } from '@/lib/planned-patterns';
import type { PaletteItem } from '@/ui';

/**
 * Patterns announced and not yet written, from the one list the home page and the footer use:
 * listed so people know they are coming. A copy of that list here once showed a pattern twice,
 * as published and as not published (2026-11-15).
 */
const upcoming: readonly PaletteItem[] = plannedPatterns.map(({ id, name }) => ({
  id,
  label: name,
  description: 'In progress',
  href: '',
  isDisabled: true,
  group: 'Patterns',
}));

const published: readonly PaletteItem[] = Object.values(patterns).map((pattern) => ({
  id: pattern.id,
  label: pattern.name,
  keywords: pattern.aliases,
  description: pattern.aliases.join(', '),
  href: `/patterns/${pattern.id}/`,
  group: 'Patterns',
}));

/**
 * A pattern's rules: found by their title, their pattern's name and their keys, and shown with
 * the keys. Only when something is typed: there are some thirty of them.
 */
const rulesOf = (pattern: Pattern): PaletteItem[] =>
  pattern.rules.map((rule) => ({
    id: `${pattern.id}:${rule.id}`,
    label: rule.title,
    keywords: [pattern.name, ...rule.keys],
    description: pattern.name,
    href: `/patterns/${pattern.id}/#rule-${rule.id}`,
    group: 'Rules',
    keys: rule.keys.slice(0, 3),
    isSearchOnly: true,
  }));

const pages: readonly PaletteItem[] = [
  { id: 'page:home', label: 'Home', href: '/', group: 'Pages' },
  {
    id: 'page:methodology',
    label: 'Methodology',
    keywords: ['engine', 'semantic model', 'provenance', 'limitations'],
    description: 'How Atlas measures, and what it cannot',
    href: '/methodology/',
    group: 'Pages',
  },
  {
    id: 'page:corrections',
    label: 'Suggest a correction',
    keywords: ['feedback', 'wrong', 'fix'],
    href: '/methodology/#corrections',
    group: 'Pages',
  },
];

/** Every published pattern from the contracts content, then the upcoming ones. */
export const patternItems: readonly PaletteItem[] = [...published, ...upcoming];

/** What the site's search finds: patterns, their rules, the site's pages. */
export const searchItems: readonly PaletteItem[] = [
  ...patternItems,
  ...Object.values(patterns).flatMap(rulesOf),
  ...pages,
];
