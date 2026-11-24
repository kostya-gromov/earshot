'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { nextTabIndex } from '@/ui';
import { useLinkedRule } from './use-linked-rule';
import styles from './depth.module.css';

export interface RuleTab {
  id: string;
  title: string;
  isRecommendation: boolean;
  panel: ReactNode;
}

// Vertical tabs: Up and Down move like Left and Right in the APG tabs model.
const asHorizontal: Readonly<Record<string, string>> = {
  ArrowDown: 'ArrowRight',
  ArrowUp: 'ArrowLeft',
};

/** Matches the stylesheet: below it the list is one scrolling row above the rule. */
const narrowQuery = '(max-width: 900px)';

/** The list's direction, which the stylesheet sets by width; aria-orientation must say the same. */
function useOrientation(): 'vertical' | 'horizontal' {
  const [isNarrow, setIsNarrow] = useState(false);
  useLayoutEffect(() => {
    const query = matchMedia(narrowQuery);
    const update = () => setIsNarrow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return isNarrow ? 'horizontal' : 'vertical';
}

/** The key the APG tabs model expects, or undefined for an arrow across the list. */
function tabKey(key: string, orientation: 'vertical' | 'horizontal'): string | undefined {
  const isAcross =
    orientation === 'vertical'
      ? key === 'ArrowLeft' || key === 'ArrowRight'
      : key === 'ArrowUp' || key === 'ArrowDown';
  if (isAcross) return undefined;
  return orientation === 'vertical' ? (asHorizontal[key] ?? key) : key;
}

interface TabListProps {
  tabs: readonly RuleTab[];
  selected: string;
  onSelect: (id: string) => void;
}

interface Place {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * A bar that travels to the selected tab instead of jumping, measured from the tab itself. The
 * stylesheet draws it beside the tab in a column and under it in a row.
 */
function useIndicator(list: RefObject<HTMLDivElement | null>, selected: string) {
  const [place, setPlace] = useState<Place>();
  useLayoutEffect(() => {
    const box = list.current;
    const tab = box?.querySelector<HTMLElement>(`#tab-${CSS.escape(selected)}`);
    if (!box || !tab) return;
    const measure = () =>
      setPlace({
        top: tab.offsetTop,
        left: tab.offsetLeft,
        width: tab.offsetWidth,
        height: tab.offsetHeight,
      });
    measure();
    // Tabs rewrap when the web font arrives or the window narrows; the bar follows.
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [list, selected]);
  return place;
}

/** The selected tab's bar, placed by custom properties so the stylesheet picks the axis. */
function Indicator({ place }: { place: Place }) {
  const style = {
    '--top': `${place.top}px`,
    '--left': `${place.left}px`,
    '--width': `${place.width}px`,
    '--height': `${place.height}px`,
  } as CSSProperties;
  return <span className={styles.indicator} aria-hidden="true" style={style} />;
}

/** The rules as a tab list (APG tabs): a column with Up and Down, a row on phones with Left and Right; Home and End too. */
function TabList({ tabs, selected, onSelect }: TabListProps) {
  const list = useRef<HTMLDivElement>(null);
  const place = useIndicator(list, selected);
  const orientation = useOrientation();
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const key = tabKey(event.key, orientation);
    if (key === undefined) return;
    const next = nextTabIndex(index, key, tabs.length);
    const tab = next === undefined ? undefined : tabs[next];
    if (next === undefined || !tab) return;
    event.preventDefault();
    onSelect(tab.id);
    list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }
  return (
    <div
      ref={list}
      className={styles.tabs}
      role="tablist"
      aria-label="Rules"
      aria-orientation={orientation}
    >
      {place && <Indicator place={place} />}
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-controls={`rule-${tab.id}`}
          aria-selected={tab.id === selected}
          tabIndex={tab.id === selected ? 0 : -1}
          onClick={() => onSelect(tab.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {tab.title}
          <small>{tab.isRecommendation ? 'Earshot recommendation' : 'From the standards'}</small>
        </button>
      ))}
    </div>
  );
}

/** One rule at a time, chosen from the list; links to a rule or its cards select it first. */
export function RuleTabs({ tabs, initial }: { tabs: readonly RuleTab[]; initial: string }) {
  const [selected, setSelected] = useState(initial);
  const depth = useRef<HTMLDivElement>(null);
  // The list stays put while the panel is long: when the reader has scrolled into a rule, a new
  // choice brings its title back into view instead of opening it in the middle.
  const choose = (id: string) => {
    setSelected(id);
    const box = depth.current;
    if (!box || box.getBoundingClientRect().top >= 0) return;
    const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollIntoView({ block: 'start', behavior: isReduced ? 'auto' : 'smooth' });
  };
  useLinkedRule(
    tabs.map(({ id }) => id),
    setSelected,
  );
  return (
    <div ref={depth} className={styles.depth}>
      <TabList tabs={tabs} selected={selected} onSelect={choose} />
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`rule-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          tabIndex={0}
          hidden={tab.id !== selected}
          className={styles.panel}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
