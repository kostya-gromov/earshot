'use client';

import { useEffect, useState } from 'react';
import styles from './design-lens.module.css';

interface CopyAnnotationProps {
  /** What the button says: "Copy for Figma", or how many it copies. */
  label: string;
  /** What it is said to have copied: "Focus ring on every chip", "7 requirements". */
  what: string;
  /** The annotation's text, without the line that says where it is from. */
  text: string;
  /** The page it is from, as a path; the site's address is added where the button runs. */
  path: string;
  variant?: 'quiet' | 'boxed';
  /**
   * What the button copies, added to its name and not shown: seven buttons that all read
   * "Copy for Figma" were seven identical lines in a screen reader's list of buttons.
   */
  subject?: string;
}

/**
 * Both labels in one cell, one shown: the button keeps the width of its resting label instead of
 * narrowing to "Copied" (design review 2026-11-18). A hidden label is not part of the name.
 */
function StackedLabel({ label, isCopied }: { label: string; isCopied: boolean }) {
  return (
    <>
      <span className={styles.copyLabel} data-shown={!isCopied || undefined}>
        {label}
      </span>
      <span className={styles.copyLabel} data-shown={isCopied || undefined}>
        Copied
      </span>
    </>
  );
}

/** How long the button says "Copied" before it offers to copy again. */
const shown = 2000;

/**
 * Copies a requirement as the text of an annotation, with the page it came from as its last
 * line. The outcome is on the button for a moment and in a status region; when the browser
 * refuses the clipboard, it says what to do instead.
 */
export function CopyAnnotation({
  label,
  what,
  text,
  path,
  variant = 'quiet',
  subject,
}: CopyAnnotationProps) {
  const [outcome, setOutcome] = useState<'copied' | 'failed'>();
  useEffect(() => {
    if (!outcome) return;
    const timer = setTimeout(() => setOutcome(undefined), shown);
    return () => clearTimeout(timer);
  }, [outcome]);
  async function copy() {
    const from = `From Earshot: ${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(`${text}\n\n${from}`);
      setOutcome('copied');
    } catch {
      setOutcome('failed');
    }
  }
  const shownLabel = outcome === 'copied' ? 'Copied' : label;
  const said =
    outcome === 'copied'
      ? `Copied ${what}. Paste it into an annotation in Figma.`
      : outcome === 'failed'
        ? 'Copy failed. Select the text on the page and copy it with your keyboard.'
        : '';
  return (
    <>
      <button
        type="button"
        className={styles.copy}
        data-variant={variant}
        // An aria-label, not hidden text: Chromium put a space before a hidden span ("Figma :").
        aria-label={subject && `${shownLabel}: ${subject}`}
        onClick={() => void copy()}
      >
        <StackedLabel label={label} isCopied={outcome === 'copied'} />
      </button>
      <span className="visually-hidden" role="status">
        {said}
      </span>
    </>
  );
}
