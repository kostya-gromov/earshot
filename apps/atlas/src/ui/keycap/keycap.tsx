import { Glyph, hasGlyph } from './glyphs';
import styles from './keycap.module.css';

/** Spoken names for keys whose visible label is a glyph or an abbreviation. */
const spokenNames: Readonly<Record<string, string>> = {
  ArrowLeft: 'Left Arrow',
  ArrowRight: 'Right Arrow',
  ArrowUp: 'Up Arrow',
  ArrowDown: 'Down Arrow',
};

const spokenName = (key: string): string => spokenNames[key] ?? key;

export type KeycapSize = 'md' | 'sm';

function Cap({ name, pressed, size }: { name: string; pressed: boolean; size: KeycapSize }) {
  return (
    <kbd className={styles.cap} data-pressed={pressed || undefined} data-size={size}>
      {hasGlyph(name) ? (
        <>
          <Glyph name={name} />
          <span className="visually-hidden">{spokenName(name)}</span>
        </>
      ) : (
        name
      )}
    </kbd>
  );
}

interface KeycapProps {
  /** A key or a combination in Playwright notation, as rules store it: "Backspace", "Shift+Tab". */
  keys: string;
  /** Lit while the key is held, for the playground; the visual press, not a toggle state. */
  pressed?: boolean;
  /** Small caps sit in dense places: a replay scrubber, a trail of keys. */
  size?: KeycapSize;
}

/**
 * A key or key combination. Glyph keys keep their spoken name as hidden text, so a screen reader
 * reads "Shift plus Tab" rather than nothing.
 */
export function Keycap({ keys, pressed = false, size = 'md' }: KeycapProps) {
  const parts = keys.split('+');
  if (parts.length === 1) return <Cap name={keys} pressed={pressed} size={size} />;
  return (
    <kbd className={styles.combo}>
      {parts.map((part, index) => (
        <span key={part} className={styles.part}>
          {index > 0 && (
            <span className={styles.plus} aria-hidden="true">
              +
            </span>
          )}
          {index > 0 && <span className="visually-hidden"> plus </span>}
          <Cap name={part} pressed={pressed} size={size} />
        </span>
      ))}
    </kbd>
  );
}
