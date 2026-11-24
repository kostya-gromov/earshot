import { PatternPalette } from '@/features/command-palette';
import { SiteMenu } from '@/features/site-menu';
import { BrandMark } from '@/ui';
import styles from './site-header.module.css';

export interface Crumb {
  label: string;
  href: string;
}

/** Brand, where you are, search and the menu: the same on every page. The theme is in the menu. */
export function SiteHeader({ crumbs }: { crumbs: readonly Crumb[] }) {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="/" aria-current={crumbs.length === 0 ? 'page' : undefined}>
        <BrandMark />
        Earshot
      </a>
      {/* The home page is the root of the trail, so it has none. */}
      {crumbs.length > 0 && (
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <ol>
            {crumbs.map((crumb, index) => (
              <li key={crumb.href}>
                <a
                  href={crumb.href}
                  aria-current={index === crumbs.length - 1 ? 'page' : undefined}
                >
                  {crumb.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className={styles.end}>
        <PatternPalette />
        <SiteMenu />
      </div>
    </header>
  );
}
