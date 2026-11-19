import type { MenuLink } from './menu-content';

/**
 * The section the reader is in: the last one whose heading has passed the upper third of the
 * window. Read when the menu opens; undefined above the first section.
 */
export function currentSection(sections: readonly MenuLink[]): string | undefined {
  const line = window.innerHeight / 3;
  const passed = sections.filter(({ href }) => {
    const heading = document.getElementById(href.slice(1));
    return heading !== null && heading.getBoundingClientRect().top <= line;
  });
  return passed.at(-1)?.href;
}
