import { CommandPalette } from '@/ui';
import { searchItems } from './pattern-items';

/**
 * The site's search, under ⌘K: patterns, their rules and the site's pages. Before anything is
 * typed it lists the patterns and the pages; a rule is found by its title, its pattern or its
 * keys ("Escape"). Choosing a result follows its link.
 */
export function PatternPalette() {
  return (
    <CommandPalette
      noun="result"
      label="Search"
      placeholder="Search patterns and rules"
      items={searchItems}
    />
  );
}
