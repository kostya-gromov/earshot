import { maxCompared } from '@/lib/compare-selection';
import type { CompareOption } from './compare-types';
import styles from './matrix.module.css';

interface ComparePickerProps {
  options: readonly CompareOption[];
  selected: readonly string[];
  onToggle: (id: string) => void;
}

/**
 * Toggle buttons, not a combobox: with a handful of systems every choice stays visible and one
 * press adds or removes it. A full selection keeps the other buttons focusable but inert
 * (aria-disabled) and says why, so nobody presses into silence.
 */
export function ComparePicker({ options, selected, onToggle }: ComparePickerProps) {
  const isFull = selected.length >= maxCompared;
  return (
    <div className={styles.picker} role="group" aria-labelledby="compare-label">
      <span id="compare-label" className={styles.pickerLabel}>
        Compare with
      </span>
      <div className={styles.options}>
        {options.map(({ id, name }) => {
          const isPressed = selected.includes(id);
          const isBlocked = isFull && !isPressed;
          return (
            <button
              key={id}
              type="button"
              className={styles.option}
              aria-pressed={isPressed}
              aria-disabled={isBlocked || undefined}
              aria-describedby={isBlocked ? 'compare-limit' : undefined}
              onClick={() => !isBlocked && onToggle(id)}
            >
              {name}
            </button>
          );
        })}
      </div>
      <span id="compare-limit" className={styles.limit} data-visible={isFull || undefined}>
        Up to {maxCompared} at a time. Remove one to add another.
      </span>
    </div>
  );
}
