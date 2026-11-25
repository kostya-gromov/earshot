import type { ReactNode } from 'react';
import { measure } from './combobox-visual';
import styles from './more-visuals.module.css';

interface DialogProps {
  /** What the drawing points at: the title, the closing button, focus, or the button's target. */
  subject?: 'title' | 'close' | 'focus' | 'target';
}

/**
 * The reference's dialog, small (packages/reference/dialog): the title "Edit profile", a Name
 * field that takes focus when it opens, and Cancel and Save, which close it.
 */
function Dialog({ subject }: DialogProps) {
  return (
    <span className={styles.dialog}>
      <span className={styles.dialogTitle} data-subject={subject === 'title' || undefined}>
        Edit profile
      </span>
      <span className={styles.field} data-focus={subject === 'focus' || undefined}>
        Name
      </span>
      <span className={styles.actions}>
        <span
          className={styles.button}
          data-subject={subject === 'close' || undefined}
          data-target={subject === 'target' || undefined}
        >
          Cancel
        </span>
        <span className={styles.button}>Save</span>
      </span>
    </span>
  );
}

/** Drawings for the modal dialog requirements, by requirement id. */
export const dialogVisuals = {
  'visible-title': () => (
    <span className={styles.drawing}>
      <Dialog subject="title" />
      {measure('name = title')}
    </span>
  ),
  'visible-close': () => (
    <span className={styles.drawing}>
      <Dialog subject="close" />
      {measure('closes')}
    </span>
  ),
  // The page behind as lines of text under a dim layer, the dialog over it.
  'page-behind-dimmed': () => (
    <span className={styles.drawing}>
      <span className={styles.page}>
        <span className={styles.dim} />
        <Dialog />
      </span>
      {measure('dimmed')}
    </span>
  ),
  'dialog-focus-visible': () => (
    <span className={styles.drawing}>
      <Dialog subject="focus" />
      {measure('3:1')}
    </span>
  ),
  // The button that opens the dialog, an arrow, and where focus lands: the decision drawn as a
  // move, apart from "focus visible" above, which draws the ring only (2026-11-25).
  'initial-focus-decided': () => (
    <span className={styles.drawing}>
      <span className={styles.opens}>
        <span className={styles.button}>Edit profile</span>
        <svg className={styles.arrow} viewBox="0 0 12 20" focusable="false">
          <path d="M6 1v16M1.5 12.5 6 17l4.5-4.5" />
        </svg>
        <Dialog subject="focus" />
      </span>
      {measure('first field')}
    </span>
  ),
  'close-target': () => (
    <span className={styles.drawing}>
      <Dialog subject="target" />
      {measure('24 px')}
    </span>
  ),
} satisfies Record<string, () => ReactNode>;
