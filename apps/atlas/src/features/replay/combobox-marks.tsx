import styles from './combobox.module.css';

/*
 * The two marks of a combobox replay. They differ in shape and in place, not only in colour: the
 * triangle on the left is the active option, the check on the right is the selected one. A
 * system's difference on "selected" is exactly these two marks landing on different rows.
 */

export function ActiveMark() {
  return (
    <svg className={styles.activeMark} viewBox="0 0 8 10" aria-hidden="true" focusable="false">
      <path d="M1 1 7 5 1 9z" />
    </svg>
  );
}

export function SelectedMark() {
  return (
    <svg className={styles.selectedMark} viewBox="0 0 12 10" aria-hidden="true" focusable="false">
      <path d="m1.5 5.5 3 3 6-7" />
    </svg>
  );
}

interface ComboboxLegendProps {
  /** False where the recording never shows a list: its two marks then refer to nothing drawn. */
  hasList?: boolean;
  /** False where nothing is written to a live region in the recording. */
  hasMessage?: boolean;
}

/**
 * What a combobox replay's signs mean, in words, above its schematics: the two marks, and the
 * two kinds of spoken line, worded as the playground's own key words them. Only the signs that
 * occur in the recording are listed.
 */
export function ComboboxLegend({ hasList = true, hasMessage = true }: ComboboxLegendProps) {
  return (
    <ul className={styles.legend} aria-label="Legend">
      {hasList && (
        <>
          <li className={styles.legendItem}>
            <ActiveMark /> active option
          </li>
          <li className={styles.legendItem}>
            <SelectedMark /> selected
          </li>
        </>
      )}
      <li className={styles.legendItem}>
        <span className={styles.legendSpeech} aria-hidden="true">
          Aa
        </span>
        Said when focus lands
      </li>
      {hasMessage && (
        <li className={styles.legendItem}>
          <span className={styles.legendSpeech} data-source="announcement" aria-hidden="true">
            Aa
          </span>
          Live region message
        </li>
      )}
    </ul>
  );
}
