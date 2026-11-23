import type { TabsMoment, TabsTab } from '@/lib/tabs-replay';
import list from './combobox.module.css';
import styles from './tabs.module.css';

interface TabsFieldProps {
  moment: TabsMoment;
  size?: 'md' | 'sm';
  /** The name the box outside the tabs carries at this moment, if the recording has one. */
  outside?: string | undefined;
  /** Every name that box carries in the recording: it keeps the width of the longest. */
  outsideNames?: readonly string[];
  /** Set when focus leaves the page in this recording: the side it left by, from the key. */
  awaySide?: 'before' | 'after' | undefined;
  /** True in a replay that is stepped through: its changes may move. */
  isLive?: boolean;
}

function Tab({ tab }: { tab: TabsTab }) {
  return (
    <span
      className={styles.tab}
      data-target={tab.hasFocus || undefined}
      data-selected={tab.isSelected === true || undefined}
      data-unstated={tab.isSelected === undefined || undefined}
    >
      {tab.name}
    </span>
  );
}

/** The shown panel by the name the tree gives it; none, or several, said in words. */
function Panel({ moment }: { moment: TabsMoment }) {
  const { focus, panels } = moment;
  const words =
    panels.length === 1 ? (
      <>
        <span className={styles.panelRole}>Panel</span>
        {panels[0]}
      </>
    ) : panels.length === 0 ? (
      'No panel'
    ) : (
      `${panels.length} panels`
    );
  return (
    <div
      className={styles.panel}
      data-target={focus.kind === 'panel' || undefined}
      data-missing={panels.length !== 1 || undefined}
    >
      <span>{words}</span>
      {focus.kind === 'in-panel' && (
        <span className={styles.inside} data-target="">
          {focus.name || focus.role}
        </span>
      )}
    </div>
  );
}

/**
 * A schematic of one recorded moment of tabs, not a picture of the system: the tabs with the
 * selected one and the one that has focus, the panel the tree shows, and the control after the
 * tabs when focus goes there. Hidden from assistive technology; the same facts are always written
 * beside it.
 */
export function TabsField({
  moment,
  size = 'md',
  outside,
  outsideNames = [],
  awaySide,
  isLive = false,
}: TabsFieldProps) {
  // Not a place on the page, and not a loss: neutral, never the focus blue or the red. On a
  // line of its own, above the tabs when focus left backwards and below the panel when it left
  // forwards: the drawing keeps one height at every step.
  const away = (
    <span className={styles.away} data-target={moment.focus.kind === 'away' || undefined}>
      Outside the page
    </span>
  );
  return (
    <div
      className={`${list.wrap} ${styles.wrap}`}
      data-size={size}
      data-live={isLive || undefined}
      aria-hidden="true"
    >
      {awaySide === 'before' && away}
      <div className={styles.row}>
        <span className={styles.list}>
          {moment.tabs.map((tab) => (
            <Tab key={tab.name} tab={tab} />
          ))}
        </span>
      </div>
      {/* The control outside sits beside the panel, not above or below the tabs: the schematic
          does not claim where on the page it is, only that focus went there. */}
      <div className={styles.row}>
        <Panel moment={moment} />
        {outside !== undefined && (
          <span
            className={`${list.next} ${styles.names}`}
            data-target={moment.focus.kind === 'outside' || undefined}
          >
            {/* Every name in one cell, one seen: the box does not change width between steps. */}
            {[...new Set([outside, ...outsideNames])].map((name) => (
              <span key={name} data-unseen={name !== outside || undefined}>
                {name}
              </span>
            ))}
          </span>
        )}
      </div>
      {awaySide === 'after' && away}
    </div>
  );
}

/** What a tabs replay's signs mean, in words, above its schematics. */
export function TabsLegend({ leavesPage = false }: { leavesPage?: boolean }) {
  return (
    <ul className={list.legend} aria-label="Legend">
      <li className={list.legendItem}>
        <span className={styles.legendSelected} aria-hidden="true">
          Tab
        </span>
        selected
      </li>
      <li className={list.legendItem}>
        <span className={styles.legendFocus} aria-hidden="true">
          Tab
        </span>
        has focus
      </li>
      <li className={list.legendItem}>
        <span className={list.legendSpeech} aria-hidden="true">
          Aa
        </span>
        Said when focus lands
      </li>
      {leavesPage && (
        <li className={list.legendItem}>
          <span className={styles.legendAway} aria-hidden="true" />
          focus outside the page
        </li>
      )}
    </ul>
  );
}
