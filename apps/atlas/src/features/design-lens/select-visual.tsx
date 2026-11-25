import type { ReactNode } from 'react';
import { measure } from './combobox-visual';
import styles from './design-lens.module.css';
import more from './more-visuals.module.css';

/**
 * A select's field as the reference draws it (packages/reference/select): the chosen value and a
 * chevron, no caret, because nothing is typed into it.
 */
function SelectField({ isBare = false }: { isBare?: boolean }) {
  return (
    <span className={`${styles.field} ${more.selectField}`} data-bare={isBare || undefined}>
      Banana
      <svg className={more.chevron} viewBox="0 0 10 6" focusable="false">
        <path d="M1 1l4 4 4-4" />
      </svg>
    </span>
  );
}

/** The select's own drawing for the one requirement only it has. */
export const selectVisuals = {
  // The choice itself: the browser's element, and a custom one that has to build the same keys,
  // typing and value (design review 2026-11-25-select: one closed field showed no decision).
  'native-select-first': () => (
    <span className={more.pairs}>
      <span className={more.pair}>
        <SelectField />
        {measure('<select>')}
      </span>
      <span className={more.pair}>
        <SelectField />
        {measure('role=combobox')}
      </span>
    </span>
  ),
} satisfies Record<string, () => ReactNode>;

/**
 * Requirements the select shares with the combobox by id, drawn as a select: the combobox's
 * field holds typed text, a select's holds its value.
 */
export const selectOwnDrawings: Readonly<Record<string, () => ReactNode>> = {
  'visible-label': () => (
    <>
      <span className={styles.label}>Fruit</span>
      <SelectField />
    </>
  ),
  // With no boundary the value and chevron read as text; with one, as a field.
  'field-boundary': () => (
    <span className={more.pair}>
      <SelectField isBare />
      <SelectField />
      {measure('3:1')}
    </span>
  ),
};
