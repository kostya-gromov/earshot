import type { ReactNode } from 'react';
import { measure } from './combobox-visual';
import styles from './more-visuals.module.css';

const names = ['Overview', 'Activity', 'Members'] as const;

interface TabListProps {
  selected?: number;
  focused?: number;
  /** Drawn as forced colours draw it: system colours, the bar and the ring only. */
  isForced?: boolean;
}

/**
 * Three tabs as the reference draws them (packages/reference/tabs): the selected one with a
 * 3 px bar and a heavier weight, focus as a 2 px ring 2 px outside the tab, so the bar stays
 * visible inside it.
 */
function TabList({ selected = 0, focused, isForced = false }: TabListProps) {
  return (
    <span className={styles.tabs} data-forced={isForced || undefined}>
      {names.map((name, index) => (
        <span
          key={name}
          className={styles.tab}
          data-selected={index === selected || undefined}
          data-focus={index === focused || undefined}
        >
          {name}
        </span>
      ))}
    </span>
  );
}

/** Drawings for the tabs requirements, by requirement id. */
export const tabsVisuals = {
  'selected-tab-marked': () => (
    <span className={styles.drawing}>
      <TabList />
      {measure('bar 3:1')}
    </span>
  ),
  'tab-focus-visible': () => (
    <span className={styles.drawing}>
      <TabList focused={1} />
      {measure('3:1')}
    </span>
  ),
  'focus-distinct-from-selected': () => (
    <span className={styles.drawing}>
      <TabList focused={0} />
      {measure('ring ≠ bar')}
    </span>
  ),
  'forced-colors': () => (
    <span className={styles.drawing}>
      <TabList focused={1} isForced />
      {measure('forced colours')}
    </span>
  ),
} satisfies Record<string, () => ReactNode>;
