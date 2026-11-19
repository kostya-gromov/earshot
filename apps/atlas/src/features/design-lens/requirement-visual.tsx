import { comboboxVisuals } from './combobox-visual';
import { menuVisuals } from './menu-visual';
import styles from './design-lens.module.css';

/** Drawings of the patterns with a list or a menu, by requirement id; chips are drawn below. */
const listVisuals = { ...comboboxVisuals, ...menuVisuals };

function Chip({
  name,
  state,
}: {
  name: string;
  state?: 'focus' | 'invalid' | 'read-only' | 'target';
}) {
  const initials =
    name === 'dana@'
      ? '!'
      : name
          .split(' ')
          .map((part) => part[0])
          .join('');
  return (
    <span className={styles.chip} data-state={state}>
      <i>{initials}</i>
      {name}
      {state !== 'read-only' && (
        <b>
          {/* Drawn, not the "×" character: a glyph sits where its font puts it, below the middle. */}
          <svg viewBox="0 0 8 8" focusable="false">
            <path d="M1 1l6 6M7 1 1 7" />
          </svg>
        </b>
      )}
    </span>
  );
}

/**
 * A small drawing per requirement, so a designer sees the decision. Decorative: the title and
 * reason carry the meaning. Values drawn come from the reference (132 px, 24 px, its hint text).
 */
export function RequirementVisual({ id }: { id: string }) {
  switch (id) {
    case 'focus-ring':
      return <Chip name="Irene Oh" state="focus" />;
    case 'remove-target':
      return <Chip name="Irene Oh" state="target" />;
    case 'chip-contrast':
      return (
        <>
          <Chip name="Irene Oh" />
          <span className={styles.measure}>4.5:1</span>
        </>
      );
    case 'invalid-in-text':
      return <Chip name="dana@" state="invalid" />;
    case 'label-and-hint':
      return (
        <>
          <span className={styles.label}>To</span>
          <span className={styles.hint}>Backspace reaches selected people.</span>
        </>
      );
    case 'max-height':
      return <span className={styles.max}>max 132 px</span>;
    case 'read-only-over-disabled':
      return <Chip name="Irene Oh" state="read-only" />;
    default:
      return listVisuals[id]?.() ?? null;
  }
}
