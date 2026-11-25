import type { ReactNode } from 'react';
import styles from './external-link.module.css';

/** "w3.org" from "https://www.w3.org/WAI/…": the site a link leaves for, said the short way. */
export const domainOf = (href: string): string => new URL(href).hostname.replace(/^www\./, '');

/**
 * The arrow that marks a link leaving Earshot. Decorative: the domain beside it, or the list it
 * sits in, says where the link goes.
 */
export function ExternalMark() {
  return (
    <svg className={styles.mark} viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
      <path d="M4 2.5h5.5V8M9.5 2.5 2.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string | undefined;
}

/**
 * A link to another site, told apart from Earshot's own by the domain and an arrow (external
 * feedback, 2026-11-24: links to WCAG and APG read like pages of the site). The domain is part of
 * the link's name, so a screen reader hears where it goes as well.
 */
export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a href={href} className={className ? `${styles.link} ${className}` : styles.link}>
      {children}
      {/* Domain and arrow never part across a line break: the arrow alone read as a stray mark. */}
      <span className={styles.domain}>
        {' '}
        {domainOf(href)}
        <ExternalMark />
      </span>
    </a>
  );
}
