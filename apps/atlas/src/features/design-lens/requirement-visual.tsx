import type { ReactNode } from 'react';
import { comboboxVisuals } from './combobox-visual';
import { dialogVisuals } from './dialog-visual';
import type { DrawnRequirementId } from './drawn';
import { menuVisuals } from './menu-visual';
import { selectOwnDrawings, selectVisuals } from './select-visual';
import { tabsVisuals } from './tabs-visual';
import styles from './design-lens.module.css';

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

/** Drawings for the input-with-chips requirements, by requirement id. */
const chipVisuals = {
  'focus-ring': () => <Chip name="Irene Oh" state="focus" />,
  'remove-target': () => <Chip name="Irene Oh" state="target" />,
  'chip-contrast': () => (
    <>
      <Chip name="Irene Oh" />
      <span className={styles.measure}>4.5:1</span>
    </>
  ),
  'invalid-in-text': () => <Chip name="dana@" state="invalid" />,
  'label-and-hint': () => (
    <>
      <span className={styles.label}>To</span>
      <span className={styles.hint}>Backspace reaches selected people.</span>
    </>
  ),
  'max-height': () => <span className={styles.max}>max 132 px</span>,
  'read-only-over-disabled': () => <Chip name="Irene Oh" state="read-only" />,
};

/**
 * Every requirement's drawing, typed against the list in drawn.ts: an id listed there with no
 * drawing here fails the build.
 */
const requirementVisuals = {
  ...chipVisuals,
  ...comboboxVisuals,
  ...menuVisuals,
  ...tabsVisuals,
  ...dialogVisuals,
  ...selectVisuals,
} satisfies Record<DrawnRequirementId, () => ReactNode>;

const isDrawn = (id: string): id is DrawnRequirementId => id in requirementVisuals;

/** A pattern's own drawing of a requirement it shares by id with another pattern. */
const ownDrawings: Readonly<Record<string, Readonly<Record<string, () => ReactNode>>>> = {
  select: selectOwnDrawings,
};

/**
 * A small drawing per requirement, so a designer sees the decision. Decorative: the title and
 * reason carry the meaning. Values drawn come from the reference (132 px, 24 px, its hint text).
 */
export function RequirementVisual({ id, patternId }: { id: string; patternId: string }) {
  const own = ownDrawings[patternId]?.[id];
  if (own) return own();
  return isDrawn(id) ? requirementVisuals[id]() : null;
}
