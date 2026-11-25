import { menuPatterns, pageSections, siteLinks } from './menu-content';
import { MenuPopover } from './menu-popover';

/**
 * The site's menu: a panel under its button with every pattern, the sections of the page the
 * reader is on, and the site's pages. Navigation only: finding a pattern by name is the
 * palette's job, under ⌘K, the shortcut people know for search (2026-11-17). A panel,
 * not a window over the page: for six patterns a menu is read in a second and the page stays
 * in view (chosen from three drafts the same day). The content is built on the server.
 */
export function SiteMenu() {
  return <MenuPopover patterns={menuPatterns} sections={pageSections} links={siteLinks} />;
}
