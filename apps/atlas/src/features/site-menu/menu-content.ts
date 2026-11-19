import { patterns } from '@earshot/contracts';

export interface MenuLink {
  label: string;
  href: string;
}

/** A pattern as the menu lists it: its name, the names it also goes by, its page. */
export interface MenuPattern extends MenuLink {
  id: string;
  aliases: string;
}

export const menuPatterns: readonly MenuPattern[] = Object.values(patterns).map((pattern) => ({
  id: pattern.id,
  label: pattern.name,
  aliases: pattern.aliases.join(', '),
  href: `/patterns/${pattern.id}/`,
}));

/**
 * The sections of a pattern page, by the ids their headings have. Every pattern page is built
 * from the same sections, so the list is one; it is shown only on such a page.
 */
export const pageSections: readonly MenuLink[] = [
  { label: 'Playground', href: '#playground-title' },
  { label: 'Every system, every rule', href: '#systems-title' },
  { label: 'The rules', href: '#evidence-title' },
  { label: 'Run it on your component', href: '#run-title' },
  { label: 'For design and for code', href: '#lens' },
];

/** The site's own pages, as in the footer. */
export const siteLinks: readonly MenuLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Methodology', href: '/methodology/' },
  { label: 'Suggest a correction', href: '/methodology/#corrections' },
];
