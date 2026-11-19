'use client';

import { useId, useState, type ReactNode } from 'react';
import styles from './disclosure.module.css';

interface DisclosureProps {
  /** The button text: says what opens, for example "Evidence". */
  label: ReactNode;
  children: ReactNode;
  initiallyOpen?: boolean;
  /** Controlled use, when something else may open it too (a link to content inside). */
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Plain content, without the well around it, when the content brings its own surface. */
  isBare?: boolean;
  /**
   * `plain`: the button is a quiet row of text with its chevron, for a disclosure inside a list
   * whose rows must stay the loudest thing. `row`: a full-width row between hairlines, chevron at
   * its end, for a stack of disclosures among tables. Default: the boxed button.
   */
  tone?: 'boxed' | 'plain' | 'row';
  /**
   * "in-parent-grid" lets the parent grid place the button and the region separately, for
   * example the button in a row's last column and the region full width underneath.
   */
  layout?: 'stacked' | 'in-parent-grid';
}

/**
 * APG disclosure (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/): a native button with
 * aria-expanded controls a region, so Enter and Space work without key handlers.
 */
export function Disclosure(props: DisclosureProps) {
  const contentId = useId();
  const [ownOpen, setOwnOpen] = useState(props.initiallyOpen ?? false);
  const isOpen = props.isOpen ?? ownOpen;
  const toggle = () => {
    setOwnOpen(!isOpen);
    props.onOpenChange?.(!isOpen);
  };

  return (
    <div
      className={styles.disclosure}
      data-layout={props.layout ?? 'stacked'}
      data-tone={props.tone ?? 'boxed'}
    >
      <button
        type="button"
        className={styles.button}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={toggle}
      >
        {props.label}
        <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {props.tone === 'plain' ? (
        // Kept in the page when closed, so its height can travel in CSS; `inert` and hidden
        // visibility keep it from focus and from assistive technology meanwhile.
        <div
          id={contentId}
          className={styles.region}
          data-open={isOpen || undefined}
          inert={!isOpen}
        >
          <div className={styles.regionInner}>{props.children}</div>
        </div>
      ) : (
        <div
          id={contentId}
          className={props.isBare ? styles.bare : styles.content}
          hidden={!isOpen}
        >
          {props.children}
        </div>
      )}
    </div>
  );
}
