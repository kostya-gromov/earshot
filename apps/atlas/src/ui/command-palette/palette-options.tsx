'use client';

import { Keycap } from '../keycap/keycap';
import { sectionsOf, type PaletteItem } from './palette-model';
import styles from './command-palette.module.css';

interface PaletteOptionsProps {
  id: string;
  label: string;
  results: readonly PaletteItem[];
  active: number | undefined;
  optionId: (index: number) => string;
  onChoose: (item: PaletteItem) => void;
  onHover: (index: number) => void;
}

type OptionProps = Omit<PaletteOptionsProps, 'id' | 'label' | 'results'> & {
  item: PaletteItem;
  index: number;
};

/** One option. Never focused: the input points at the active one. */
function Option({ item, index, active, optionId, onChoose, onHover }: OptionProps) {
  return (
    <li
      id={optionId(index)}
      role="option"
      aria-selected={index === active}
      aria-disabled={item.isDisabled || undefined}
      className={styles.option}
      // Keep DOM focus in the input when an option is clicked.
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={() => onHover(index)}
      onClick={() => !item.isDisabled && onChoose(item)}
    >
      <span className={styles.optionText}>
        <span className={styles.optionLabel}>{item.label}</span>
        {item.description && <span className={styles.optionNote}>{item.description}</span>}
      </span>
      {item.keys && (
        // Shown, not read: the option is named by its label, and its page says the keys.
        <span className={styles.optionKeys} aria-hidden="true">
          {item.keys.map((keys) => (
            <Keycap key={keys} keys={keys} size="sm" />
          ))}
        </span>
      )}
    </li>
  );
}

/**
 * The listbox: one list for the arrow keys, with a title over each kind of result when the
 * items say their kind (a listbox may hold groups of options).
 */
export function PaletteOptions(props: PaletteOptionsProps) {
  const { id, label, results, ...option } = props;
  const sections = sectionsOf(results);
  if (sections.every(({ title }) => title === undefined)) {
    return (
      <ul role="listbox" id={id} aria-label={label} className={styles.list}>
        {results.map((item, index) => (
          <Option key={item.id} item={item} index={index} {...option} />
        ))}
      </ul>
    );
  }
  return (
    <div role="listbox" id={id} aria-label={label} className={styles.list}>
      {sections.map(({ title, entries }) => (
        <ul key={title ?? ''} role="group" aria-label={title} className={styles.group}>
          <li role="presentation" className={styles.groupTitle}>
            {title}
          </li>
          {entries.map(({ item, index }) => (
            <Option key={item.id} item={item} index={index} {...option} />
          ))}
        </ul>
      ))}
    </div>
  );
}
