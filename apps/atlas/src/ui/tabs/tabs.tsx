'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { nextTabIndex } from './tab-navigation';
import styles from './tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  /** A second line under the label; the large lens tabs use it. */
  description?: string;
  panel: ReactNode;
}

interface TabsProps {
  /** Names the tab list for screen readers. */
  label: string;
  items: readonly TabItem[];
  variant?: 'lens' | 'compact' | 'files';
  /** Controlled use, when something outside the list selects a tab (a code note). */
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Controls in the same bar as the tab list, after it ("Copy file"). */
  toolbar?: ReactNode;
  /** Content beside the panels, outside them (notes about the selected file). */
  aside?: ReactNode;
  /**
   * A query parameter that names the tab to open, so a link elsewhere can open this one
   * (`?lens=code`). Read once the page runs; the static page shows the first tab.
   */
  queryKey?: string;
}

interface TabButtonProps {
  item: TabItem;
  ids: { tab: string; panel: string };
  isSelected: boolean;
  onSelect: () => void;
  register: (element: HTMLButtonElement | null) => void;
}

/** Roving tabindex: only the selected tab is in the Tab order. */
function TabButton({ item, ids, isSelected, onSelect, register }: TabButtonProps) {
  return (
    <button
      ref={register}
      type="button"
      role="tab"
      id={ids.tab}
      aria-selected={isSelected}
      aria-controls={ids.panel}
      tabIndex={isSelected ? 0 : -1}
      className={styles.tab}
      onClick={onSelect}
    >
      <span className={styles.label}>{item.label}</span>
      {item.description && <span className={styles.description}>{item.description}</span>}
    </button>
  );
}

interface TabPanelsProps {
  items: readonly TabItem[];
  selected: number;
  ids: (index: number) => { tab: string; panel: string };
}

/** Every panel is rendered; only the selected one is shown, so server content stays in place. */
function TabPanels({ items, selected, ids }: TabPanelsProps) {
  return items.map((item, index) => (
    <div
      key={item.id}
      role="tabpanel"
      id={ids(index).panel}
      aria-labelledby={ids(index).tab}
      hidden={index !== selected}
      tabIndex={0}
      className={styles.panel}
    >
      {item.panel}
    </div>
  ));
}

function useSelection(props: TabsProps) {
  const [ownId, setOwnId] = useState(props.items[0]?.id ?? '');
  const { queryKey } = props;
  // A string, not the items array: a new array each render would reselect after every click.
  const itemIds = props.items.map(({ id }) => id).join(' ');
  useEffect(() => {
    if (!queryKey) return;
    const wanted = new URLSearchParams(window.location.search).get(queryKey);
    if (wanted && itemIds.split(' ').includes(wanted)) setOwnId(wanted);
  }, [queryKey, itemIds]);
  const selectedId = props.selectedId ?? ownId;
  const select = (id: string) => {
    setOwnId(id);
    props.onSelect?.(id);
  };
  const index = Math.max(
    0,
    props.items.findIndex(({ id }) => id === selectedId),
  );
  return { index, select };
}

/**
 * APG tabs with automatic activation (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): one Tab
 * stop for the list, arrows select, Tab moves into the panel. Panels are server-rendered nodes.
 */
export function Tabs(props: TabsProps) {
  const { label, items, variant = 'compact' } = props;
  const baseId = useId();
  const { index: selected, select } = useSelection(props);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ids = (index: number) => ({
    tab: `${baseId}-tab-${index}`,
    panel: `${baseId}-panel-${index}`,
  });

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = nextTabIndex(selected, event.key, items.length);
    const item = next === undefined ? undefined : items[next];
    if (next === undefined || !item) return;
    event.preventDefault();
    select(item.id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={styles.tabs} data-variant={variant}>
      <div className={styles.bar}>
        <div role="tablist" aria-label={label} className={styles.list} onKeyDown={handleKeyDown}>
          {items.map((item, index) => (
            <TabButton
              key={item.id}
              item={item}
              ids={ids(index)}
              isSelected={index === selected}
              onSelect={() => select(item.id)}
              register={(element) => {
                tabRefs.current[index] = element;
              }}
            />
          ))}
        </div>
        {props.toolbar}
      </div>
      <div className={styles.body}>
        <TabPanels items={items} selected={selected} ids={ids} />
        {props.aside}
      </div>
    </div>
  );
}
