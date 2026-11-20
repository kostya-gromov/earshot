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

function ComboboxGlyph() {
  return (
    <svg viewBox="0 0 320 170" aria-hidden="true" focusable="false">
      <rect className={styles.focus} x="60" y="28" width="200" height="34" rx="8" />
      <path className={styles.stroke} d="M240 42 l6 6 l6 -6" />
      <g className={styles.popup}>
        <rect className={styles.stroke} x="60" y="70" width="200" height="82" rx="8" />
        <rect className={styles.active} x="68" y="78" width="184" height="20" rx="4" />
        <line className={styles.stroke} x1="78" y1="88" x2="200" y2="88" />
        <line className={styles.stroke} x1="78" y1="111" x2="190" y2="111" />
        <line className={styles.stroke} x1="78" y1="134" x2="160" y2="134" />
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

const glyphs: Readonly<Record<string, () => ReactNode>> = {
  'input-with-chips': ChipsGlyph,
  combobox: ComboboxGlyph,
  'menu-button': MenuButtonGlyph,
  tabs: TabsGlyph,
};

export function PatternGlyph({ id }: { id: string }) {
  const Glyph = glyphs[id];
  return Glyph ? <Glyph /> : null;
}
