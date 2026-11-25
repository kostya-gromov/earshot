import type { ReactNode } from 'react';
import styles from './glyphs.module.css';

// Each pattern drawn as lines, playing its own keyboard story. Decorative: what the pattern is
// is written beside it. Not measured behaviour of any system.

function ChipsGlyph() {
  return (
    <svg viewBox="0 0 320 170" aria-hidden="true" focusable="false">
      <rect className={styles.stroke} x="30" y="66" width="260" height="38" rx="8" />
      <rect className={styles.stroke} x="38" y="73" width="58" height="24" rx="5" />
      <rect className={styles.stroke} x="102" y="73" width="66" height="24" rx="5" />
      <rect
        className={`${styles.stroke} ${styles.leaving}`}
        x="174"
        y="73"
        width="60"
        height="24"
        rx="5"
      />
      <line className={styles.stroke} x1="248" y1="76" x2="248" y2="94" />
      <g className={styles.chipRing}>
        <rect className={styles.focus} x="171" y="70" width="66" height="30" rx="7" />
      </g>
    </svg>
  );
}

/** Typing filters the list: two letters and the caret in the field, a short list under it. */
function ComboboxGlyph() {
  return (
    <svg viewBox="0 0 320 170" aria-hidden="true" focusable="false">
      <rect className={styles.focus} x="60" y="28" width="200" height="34" rx="8" />
      <line className={styles.selectedBar} x1="76" y1="45" x2="94" y2="45" />
      <line className={styles.stroke} x1="100" y1="37" x2="100" y2="53" />
      <path className={styles.stroke} d="M240 42 l6 6 l6 -6" />
      <g className={styles.popup}>
        <rect className={styles.stroke} x="60" y="70" width="200" height="58" rx="8" />
        <rect className={styles.active} x="68" y="78" width="184" height="20" rx="4" />
        <line className={styles.stroke} x1="78" y1="88" x2="200" y2="88" />
        <line className={styles.stroke} x1="78" y1="111" x2="170" y2="111" />
      </g>
    </svg>
  );
}

function MenuButtonGlyph() {
  return (
    <svg viewBox="0 0 320 170" aria-hidden="true" focusable="false">
      <rect className={styles.stroke} x="60" y="28" width="96" height="34" rx="8" />
      <g className={styles.popup}>
        <rect className={styles.stroke} x="60" y="70" width="170" height="86" rx="8" />
        <line className={styles.stroke} x1="76" y1="92" x2="180" y2="92" />
        <line className={styles.stroke} x1="76" y1="114" x2="200" y2="114" />
        <line className={styles.stroke} x1="76" y1="136" x2="160" y2="136" />
      </g>
      <rect
        className={`${styles.focus} ${styles.buttonRing}`}
        x="57"
        y="25"
        width="102"
        height="40"
        rx="10"
      />
      <g className={styles.itemRing}>
        <rect className={styles.focus} x="68" y="83" width="150" height="18" rx="5" />
      </g>
    </svg>
  );
}

function TabsGlyph() {
  return (
    <svg viewBox="0 0 320 170" aria-hidden="true" focusable="false">
      <line className={styles.stroke} x1="40" y1="62" x2="280" y2="62" />
      <line className={styles.stroke} x1="54" y1="44" x2="94" y2="44" />
      <line className={styles.stroke} x1="114" y1="44" x2="154" y2="44" />
      <line className={styles.stroke} x1="174" y1="44" x2="214" y2="44" />
      <line className={styles.stroke} x1="234" y1="44" x2="266" y2="44" />
      <g className={styles.tabMove}>
        <line className={styles.selectedBar} x1="50" y1="62" x2="98" y2="62" />
        <rect className={styles.focus} x="44" y="28" width="60" height="38" rx="7" />
      </g>
      <rect className={styles.stroke} x="40" y="76" width="240" height="72" rx="8" />
      <line className={styles.stroke} x1="56" y1="98" x2="230" y2="98" />
      <line className={styles.stroke} x1="56" y1="120" x2="196" y2="120" />
    </svg>
  );
}

function DialogGlyph() {
  return (
    <svg viewBox="0 0 320 170" aria-hidden="true" focusable="false">
      {/* The page behind, fainter: the button that opened the dialog and lines of the page.
          They run under the dialog and stop at its edge, because the dialog is filled. */}
      <rect className={styles.behind} x="30" y="20" width="84" height="28" rx="8" />
      <line className={styles.behind} x1="30" y1="76" x2="250" y2="76" />
      <line className={styles.behind} x1="30" y1="104" x2="220" y2="104" />
      <line className={styles.behind} x1="30" y1="132" x2="236" y2="132" />
      {/* The dialog over it: a title, a field with focus, two buttons. */}
      <g className={styles.popup}>
        <rect className={styles.surface} x="100" y="58" width="196" height="102" rx="10" />
        <line className={styles.stroke} x1="116" y1="78" x2="196" y2="78" />
        <rect className={styles.focus} x="116" y="90" width="164" height="26" rx="6" />
        <rect className={styles.stroke} x="180" y="126" width="46" height="22" rx="6" />
        <rect className={styles.stroke} x="234" y="126" width="46" height="22" rx="6" />
      </g>
    </svg>
  );
}

/** The select apart from the combobox: its field holds a value, not typing, and the list opens
 * on the chosen option, the third of five, checked and active, while focus stays on the field. */
function SelectGlyph() {
  // Each option as a line: its y and where its text ends.
  const rows = [
    [84, 190],
    [101, 170],
    [118, 150],
    [135, 200],
    [152, 160],
  ] as const;
  return (
    <svg viewBox="0 0 320 170" aria-hidden="true" focusable="false">
      <rect className={styles.focus} x="60" y="22" width="200" height="34" rx="8" />
      <line className={styles.selectedBar} x1="76" y1="39" x2="132" y2="39" />
      <path className={styles.stroke} d="M240 36 l6 6 l6 -6" />
      <g className={styles.popup}>
        <rect className={styles.stroke} x="60" y="64" width="200" height="100" rx="8" />
        <rect className={styles.chosen} x="68" y="109" width="184" height="18" rx="4" />
        <path className={styles.stroke} d="M78 118 l3 3 l6 -6" />
        {rows.map(([y, end]) => (
          <line key={y} className={styles.stroke} x1="96" y1={y} x2={end} y2={y} />
        ))}
      </g>
    </svg>
  );
}

const glyphs: Readonly<Record<string, () => ReactNode>> = {
  'input-with-chips': ChipsGlyph,
  combobox: ComboboxGlyph,
  'menu-button': MenuButtonGlyph,
  tabs: TabsGlyph,
  dialog: DialogGlyph,
  select: SelectGlyph,
};

export function PatternGlyph({ id }: { id: string }) {
  const Glyph = glyphs[id];
  return Glyph ? <Glyph /> : null;
}
