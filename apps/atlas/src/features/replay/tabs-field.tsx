import type { TabsMoment, TabsTab } from '@/lib/tabs-replay';
import list from './combobox.module.css';
import styles from './tabs.module.css';

interface TabsFieldProps {
  moment: TabsMoment;
  size?: 'md' | 'sm';
  /** The control focus goes to outside the tabs in this recording, if any. */
  outside?: string | undefined;
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
export function TabsField({ moment, size = 'md', outside, isLive = false }: TabsFieldProps) {
  return (
    <div
      className={`${list.wrap} ${styles.wrap}`}
      data-size={size}
      data-live={isLive || undefined}
      aria-hidden="true"
    >
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
          <span className={list.next} data-target={moment.focus.kind === 'outside' || undefined}>
            {outside}
          </span>
        )}
      </div>
    </div>
  );
}

/** What a tabs replay's signs mean, in words, above its schematics. */
export function TabsLegend() {
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
    </ul>
  );
}
