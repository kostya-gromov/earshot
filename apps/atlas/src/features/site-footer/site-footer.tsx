import type { ReactNode } from 'react';
import { patterns } from '@earshot/contracts';
import { plannedPatterns } from '@/lib/planned-patterns';
import { ThemeSwitch } from '@/features/theme';
import { BrandMark } from '@/ui';
import styles from './site-footer.module.css';

const standards = [
  { label: 'WCAG 2.2 Understanding', href: 'https://www.w3.org/WAI/WCAG22/Understanding/' },
  { label: 'WAI-ARIA Authoring Practices', href: 'https://www.w3.org/WAI/ARIA/apg/' },
];

const project = [
  { label: 'Methodology', href: '/methodology/' },
  { label: 'Suggest a correction', href: '/methodology/#corrections' },
];

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.column}>
      <h2 className={styles.columnTitle}>{title}</h2>
      <ul>{children}</ul>
    </div>
  );
}

/** Where to go next: every pattern, the standards themselves, how Earshot works. */
function FooterNav() {
  return (
    <nav className={styles.columns} aria-label="Footer">
      <Column title="Patterns">
        {Object.values(patterns).map((pattern) => (
          <li key={pattern.id}>
            <a href={`/patterns/${pattern.id}/`}>{pattern.name}</a>
          </li>
        ))}
        {plannedPatterns.map(({ name }) => (
          <li key={name} className={styles.soon}>
            {name} <span>In progress</span>
          </li>
        ))}
        <li>
          <a href="/patterns/">All patterns</a>
        </li>
      </Column>
      <Column title="Standards">
        {standards.map(({ label, href }) => (
          <li key={href}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </Column>
      <Column title="Project">
        {project.map(({ label, href }) => (
          <li key={href}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </Column>
    </nav>
  );
}

/**
 * The same on every page: what Earshot is and where to go. What it does not claim is said once per
 * page, by the page (the honesty band or note), not repeated here (design review 2026-11-12).
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <a href="/" className={styles.brandLink}>
            <BrandMark />
            Earshot
          </a>
          <p>
            How interactive components behave for keyboard and assistive technology: advice built on
            WCAG 2.2 and the ARIA Authoring Practices, and evidence measured in real design systems.
          </p>
        </div>
        <FooterNav />
      </div>
      {/* Under all the columns, on the right: last on a phone (design review 2026-11-19). */}
      <div className={styles.bottom}>
        <ThemeSwitch size="compact" />
      </div>
    </footer>
  );
}
