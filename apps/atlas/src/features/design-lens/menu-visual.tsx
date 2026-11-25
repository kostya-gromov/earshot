import type { ReactNode } from 'react';
import { Option, measure } from './combobox-visual';
import styles from './design-lens.module.css';

/**
 * Drawings for the menu button requirements, by requirement id. An item is drawn as the list
 * rows of the combobox drawings are: the focused one with an outline as well as a tint.
 */
export const menuVisuals = {
  'item-focus-visible': () => (
    <>
      <Option name="Duplicate" isActive subject="indicator" />
      {measure('3:1')}
    </>
  ),
  'item-contrast': () => (
    <>
      <Option name="Duplicate" isActive subject="text" />
      {measure('4.5:1')}
    </>
  ),
  'item-target': () => (
    <>
      <span className={styles.option} data-target>
        Rename
      </span>
      {measure('24 px')}
    </>
  ),
  // A bar of the page over the lower half of the focused item: partly covered is allowed, and
  // the focus ring still shows above the bar.
  'focused-item-in-view': () => (
    <>
      <span className={styles.covered}>
        <Option name="Delete" isActive />
        <span className={styles.cover} />
      </span>
      {measure('sticky bar')}
    </>
  ),
  // The edge of the window cuts the menu; the focused item is the part that stays inside it.
  'focused-item-on-screen': () => (
    <>
      <span className={styles.clipped}>
        <Option name="Delete" isActive />
        <Option name="Archive" />
      </span>
      {measure('in view')}
    </>
  ),
} satisfies Record<string, () => ReactNode>;
