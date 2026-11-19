import type { ReactNode } from 'react';
import styles from './design-lens.module.css';

interface OptionProps {
  name: string;
  isActive?: boolean;
  /**
   * What the drawing is about. `indicator`: the outline, with the text drawn as a grey bar.
   * `text`: the words on the highlight, with no outline to look at.
   */
  subject?: 'indicator' | 'text';
}

/** A row of a list or a menu, drawn as the references draw their focused row. */
export function Option({ name, isActive = false, subject }: OptionProps) {
  return (
    <span className={styles.option} data-active={isActive || undefined} data-subject={subject}>
      {subject === 'indicator' ? <span className={styles.textBar} /> : name}
    </span>
  );
}

export const measure = (text: string) => <span className={styles.measure}>{text}</span>;

/**
 * Drawings for the combobox requirements, by requirement id. The active option is drawn as the
 * reference draws it: an outline as well as a tint, in the colour of keyboard focus.
 */
export const comboboxVisuals: Readonly<Record<string, () => ReactNode>> = {
  'active-option-drawn': () => (
    <span className={styles.options}>
      <Option name="Apple" />
      <Option name="Apricot" isActive />
    </span>
  ),
  'active-option-contrast': () => (
    <>
      <Option name="Apricot" isActive subject="indicator" />
      {measure('3:1')}
    </>
  ),
  'option-contrast': () => (
    <>
      <Option name="Apricot" isActive subject="text" />
      {measure('4.5:1')}
    </>
  ),
  'option-target': () => (
    <>
      <span className={styles.option} data-target>
        Apple
      </span>
      {measure('24 px')}
    </>
  ),
  'visible-label': () => (
    <>
      <span className={styles.label}>Fruit</span>
      <span className={styles.field}>a</span>
    </>
  ),
  'field-boundary': () => (
    <>
      <span className={styles.field} />
      {measure('3:1')}
    </>
  ),
};
