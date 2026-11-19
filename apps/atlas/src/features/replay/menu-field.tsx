import type { CSSProperties } from 'react';
import type { ButtonState, MenuItem, MenuMoment } from '@/lib/menu-replay';
import { ActiveMark } from './combobox-marks';
import list from './combobox.module.css';
import styles from './menu.module.css';

/** A crossed circle: the item is exposed as disabled. A shape, so it never rests on colour. */
export function DisabledMark() {
  return (
    <svg className={styles.disabledMark} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <circle cx="6" cy="6" r="4.5" />
      <path d="m2.8 9.2 6.4-6.4" />
    </svg>
  );
}

/** What the button says about being expanded, in the words the tree gives or withholds. */
const stateWords: Record<ButtonState, string> = {
  expanded: 'expanded',
  collapsed: 'collapsed',
  unstated: 'no state',
  hidden: 'not in the tree',
};

function ItemRow({ item, hasFocus }: { item: MenuItem; hasFocus: boolean }) {
  return (
    <li
      className={list.option}
      data-active={item.isActive || undefined}
      data-focus={hasFocus || undefined}
      data-disabled={item.isDisabled || undefined}
    >
      <span className={list.markSlot} />
      <span className={list.optionName}>{item.name}</span>
      <span className={list.markSlot}>{item.isDisabled && <DisabledMark />}</span>
    </li>
  );
}

/** The menu as the accessibility tree held it: its items, or nothing while it is not shown. */
function Items({ moment, isExpected }: { moment: MenuMoment; isExpected: boolean }) {
  if (moment.items.length === 0) {
    return isExpected ? <p className={list.noList}>No menu</p> : null;
  }
  const focused = moment.focus.kind === 'item' ? moment.focus.index - 1 : -1;
  const active = moment.items.findIndex(({ isActive }) => isActive);
  return (
    <ul className={list.list} data-focus={moment.focus.kind === 'menu' || undefined}>
      {active >= 0 && (
        <li className={list.bar} data-mark="active" style={{ '--active': active } as CSSProperties}>
          <ActiveMark />
        </li>
      )}
      {moment.items.map((item, index) => (
        <ItemRow key={item.name} item={item} hasFocus={index === focused} />
      ))}
    </ul>
  );
}

interface MenuFieldProps {
  moment: MenuMoment;
  size?: 'md' | 'sm';
  /** Rows to keep room for under the button: the recording's longest menu. */
  rows?: number;
  /** The control focus goes to outside the menu button in this recording, if any. */
  outside?: string | undefined;
  /** True in a replay that is stepped through: its changes may move. */
  isLive?: boolean;
}

/**
 * A schematic of one recorded moment of a menu button, not a picture of the system: the button
 * with what it says about being expanded, the items with the active and the disabled one, where
 * focus is, and the page's own line once an action has run. Hidden from assistive technology;
 * the same facts are always written beside it.
 */
export function MenuField({ moment, size = 'md', rows, outside, isLive = false }: MenuFieldProps) {
  const slot = rows === undefined ? undefined : ({ '--rows': rows } as CSSProperties);
  const ran = moment.lastAction !== 'Last action: none';
  return (
    <div className={list.wrap} data-size={size} data-live={isLive || undefined} aria-hidden="true">
      <div className={list.fieldRow}>
        <span
          className={styles.button}
          data-target={moment.focus.kind === 'button' || undefined}
          data-state={moment.button}
        >
          Actions
          <span className={styles.state}>{stateWords[moment.button]}</span>
        </span>
        {outside !== undefined && (
          <span className={list.next} data-target={moment.focus.kind === 'outside' || undefined}>
            {outside}
          </span>
        )}
      </div>
      <div className={list.listSlot} style={slot}>
        <Items moment={moment} isExpected={rows !== 0} />
      </div>
      {/* The page's own words, kept in the room they will need from the first frame. */}
      <p className={styles.effect} data-ran={ran || undefined}>
        {moment.lastAction}
      </p>
    </div>
  );
}

interface MenuLegendProps {
  /** False where the recording never shows a disabled item. */
  hasDisabled?: boolean;
}

/** What a menu replay's signs mean, in words, above its schematics. */
export function MenuLegend({ hasDisabled = true }: MenuLegendProps) {
  return (
    <ul className={list.legend} aria-label="Legend">
      <li className={list.legendItem}>
        <ActiveMark /> active item
      </li>
      {hasDisabled && (
        <li className={list.legendItem}>
          <DisabledMark /> disabled
        </li>
      )}
      <li className={list.legendItem}>
        <span className={list.legendSpeech} aria-hidden="true">
          Aa
        </span>
        Said when focus lands
      </li>
    </ul>
  );
}
