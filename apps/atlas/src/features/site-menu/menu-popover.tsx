'use client';

import { usePathname } from 'next/navigation';
import { useId, useState } from 'react';
import { ThemeSwitch } from '@/features/theme';
import { currentSection } from './current-section';
import type { MenuLink, MenuPattern } from './menu-content';
import styles from './site-menu.module.css';
import { useDisclosure } from './use-disclosure';

interface MenuPopoverProps {
  patterns: readonly MenuPattern[];
  sections: readonly MenuLink[];
  links: readonly MenuLink[];
}

/** The same page whether or not its address ends with a slash. */
const samePage = (a: string, b: string) => a.replace(/\/$/, '') === b.replace(/\/$/, '');

interface PatternsProps {
  patterns: readonly MenuPattern[];
  here: string;
  onFollow: () => void;
}

function Patterns({ patterns, here, onFollow }: PatternsProps) {
  return (
    <div className={styles.column}>
      <h2 className={styles.kicker}>Patterns</h2>
      <ul>
        {patterns.map((pattern) => {
          const isHere = samePage(pattern.href, here);
          return (
            <li key={pattern.id}>
              <a
                className={styles.pattern}
                href={pattern.href}
                aria-current={isHere ? 'page' : undefined}
                onClick={onFollow}
              >
                <span className={styles.patternName}>{pattern.label}</span>
                <span className={styles.patternNote}>
                  {isHere ? 'You are here' : pattern.aliases}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface SectionsProps {
  sections: readonly MenuLink[];
  /** The section the reader was in when the menu opened. */
  current: string | undefined;
  onFollow: () => void;
}

function Sections({ sections, current, onFollow }: SectionsProps) {
  return (
    <div className={styles.column}>
      <h2 className={styles.kicker}>On this page</h2>
      <ul>
        {sections.map((section) => (
          <li key={section.href}>
            <a
              className={styles.section}
              href={section.href}
              aria-current={section.href === current ? 'location' : undefined}
              onClick={onFollow}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The button in the header and the panel it shows. */
export function MenuPopover({ patterns, sections, links }: MenuPopoverProps) {
  const id = useId();
  const here = usePathname();
  const menu = useDisclosure();
  const [current, setCurrent] = useState<string>();
  // The sections are those of a pattern page: on any other page there is nothing to list.
  const hasSections = patterns.some(({ href }) => samePage(href, here));
  const toggle = () => {
    if (!menu.isOpen && hasSections) setCurrent(currentSection(sections));
    menu.toggle();
  };
  return (
    <div ref={menu.root} className={styles.root}>
      <button
        ref={menu.button}
        type="button"
        className={styles.trigger}
        aria-expanded={menu.isOpen}
        aria-controls={id}
        onClick={toggle}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M2.5 5.5h11M2.5 10.5h11" />
        </svg>
        <span>Menu</span>
      </button>
      <nav id={id} className={styles.panel} aria-label="Menu" hidden={!menu.isOpen}>
        <div className={styles.columns} data-single={!hasSections || undefined}>
          <Patterns patterns={patterns} here={here} onFollow={menu.close} />
          {hasSections && <Sections sections={sections} current={current} onFollow={menu.close} />}
        </div>
        <div className={styles.foot}>
          <ul className={styles.footLinks}>
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={menu.close}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <ThemeSwitch />
        </div>
      </nav>
    </div>
  );
}
