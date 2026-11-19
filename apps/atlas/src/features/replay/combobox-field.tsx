import type { CSSProperties } from 'react';
import type { ComboboxMoment, ComboboxOption, ComboboxPlaces } from '@/lib/combobox-replay';
import { ActiveMark, SelectedMark } from './combobox-marks';
import styles from './combobox.module.css';

interface OptionRowProps {
  option: ComboboxOption;
  /** DOM focus is on this option, not on the combobox. */
  hasFocus: boolean;
}

/** One option: room for the active mark on the left, the selected mark on the right. */
function OptionRow({ option, hasFocus }: OptionRowProps) {
  return (
    <li
      className={styles.option}
      data-active={option.isActive || undefined}
      data-focus={hasFocus || undefined}
    >
      <span className={styles.markSlot} />
      <span className={styles.optionName}>{option.name}</span>
      <span className={styles.markSlot}>{option.isSelected && <SelectedMark />}</span>
    </li>
  );
}

/**
 * The active row's tint with its mark, one element that travels from row to row: a move of the
 * active option is then seen as a move, not as one row going dark and another lighting up.
 */
function ActiveBar({ index }: { index: number }) {
  return (
    <li className={styles.bar} data-mark="active" style={{ '--active': index } as CSSProperties}>
      <ActiveMark />
    </li>
  );
}

/** The list as the accessibility tree held it: its options, an empty list, or no list at all. */
function List({ moment, isExpected }: { moment: ComboboxMoment; isExpected: boolean }) {
  if (!moment.hasPopup && moment.options.length === 0) {
    // Where a recording never shows a list (Tab out of a closed field), its absence says nothing.
    return isExpected ? <p className={styles.noList}>No list</p> : null;
  }
  if (moment.options.length === 0) return <p className={styles.noList}>List with no options</p>;
  const focused = moment.focus.kind === 'option' ? moment.focus.index - 1 : -1;
  const active = moment.options.findIndex(({ isActive }) => isActive);
  return (
    <ul className={styles.list}>
      {/* Mounted only while an option is active: it arrives on its row and leaves at once, so it
          never slides across rows the step does not name (design review 2026-11-15). */}
      {active >= 0 && <ActiveBar index={active} />}
      {moment.options.map((option, index) => (
        <OptionRow key={option.name} option={option} hasFocus={index === focused} />
      ))}
    </ul>
  );
}

interface ComboboxFieldProps {
  moment: ComboboxMoment;
  size?: 'md' | 'sm';
  /**
   * Rows to keep room for under the field: the longest list of the recording, so a list that
   * opens or closes never moves what is written below it.
   */
  rows?: number;
  /** Where else focus goes in this recording; drawn from the first frame, so nothing shifts. */
  places?: ComboboxPlaces;
  /** True in a replay that is stepped through: its changes may move. A still frame never does. */
  isLive?: boolean;
}

/**
 * The field, with the control of the combobox that takes focus in this recording, if any, at its
 * right end: a stub, since the engine knows its name and that it is inside, not what it shows.
 */
function Field({ moment, inside }: { moment: ComboboxMoment; inside: string | undefined }) {
  return (
    <div className={styles.field} data-focus={moment.focus.kind}>
      <span className={styles.value}>{moment.value}</span>
      <span className={styles.caret} />
      {inside !== undefined && (
        <span className={styles.stub} data-target={moment.focus.kind === 'other' || undefined} />
      )}
    </div>
  );
}

/**
 * A schematic of one recorded moment, not a picture of the system: the text in the field, the
 * list, the two marks and where focus is, the places it goes to besides the combobox included.
 * Hidden from assistive technology; the same facts are always written beside it.
 */
export function ComboboxField({
  moment,
  size = 'md',
  rows,
  places,
  isLive = false,
}: ComboboxFieldProps) {
  const slot = rows === undefined ? undefined : ({ '--rows': rows } as CSSProperties);
  return (
    <div
      className={styles.wrap}
      data-size={size}
      data-live={isLive || undefined}
      aria-hidden="true"
    >
      <div className={styles.fieldRow}>
        <Field moment={moment} inside={places?.inside} />
        {places?.outside !== undefined && (
          <span className={styles.next} data-target={moment.focus.kind === 'outside' || undefined}>
            {places.outside}
          </span>
        )}
      </div>
      <div className={styles.listSlot} style={slot}>
        <List moment={moment} isExpected={rows !== 0} />
      </div>
    </div>
  );
}
