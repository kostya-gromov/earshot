import type { DialogControl, DialogMoment } from '@/lib/dialog-replay';
import list from './combobox.module.css';
import styles from './dialog.module.css';

interface DialogFieldProps {
  moment: DialogMoment;
  /** The name of the button that opens the dialog, as recorded. */
  openerName: string;
  /** The controls inside the dialog the recording names, by their place. */
  controls: readonly DialogControl[];
  /** How many controls the dialog holds, as the engine counted them; undefined when unknown. */
  controlCount: number | undefined;
  /** The control of the page behind that this recording touches, if any. */
  behind?: string | undefined;
  /** True on the step that clicked at that control's place. */
  isClicked?: boolean;
  /** Set when focus leaves the page in this recording: the side it left by, from the key. */
  awaySide?: 'before' | 'after' | undefined;
  size?: 'md' | 'sm';
  /** True in a replay that is stepped through: its changes may move. */
  isLive?: boolean;
}

/** The dialog's fields and buttons in their recorded order; one never focused has no name here. */
function Controls({ moment, controls, controlCount }: DialogFieldProps) {
  const focused = moment.focus.kind === 'inside' ? moment.focus : undefined;
  const count = Math.max(controlCount ?? 0, ...controls.map(({ index }) => index));
  const slots = Array.from({ length: count }, (_, place) =>
    controls.find(({ index }) => index === place + 1),
  );
  // Focus on a control the engine gave no place: drawn after the others, by its name.
  const unplaced = focused && focused.index === undefined ? focused : undefined;
  return (
    <span className={styles.controls}>
      {slots.map((control, place) => (
        <span
          key={place}
          className={styles.control}
          data-role={control?.role ?? undefined}
          data-unnamed={control === undefined || undefined}
          data-target={focused?.index === place + 1 || undefined}
        >
          {control?.name ?? ''}
        </span>
      ))}
      {unplaced && (
        <span className={styles.control} data-target="">
          {unplaced.name || unplaced.role}
        </span>
      )}
    </span>
  );
}

/** Not a place on the page, and not a loss: neutral, never the focus blue or the red. */
function Away({ moment }: Pick<DialogFieldProps, 'moment'>) {
  return (
    <span className={styles.away} data-target={moment.focus.kind === 'away' || undefined}>
      Outside the page
    </span>
  );
}

/** The page: the button that opens the dialog and, where the recording touches it, one control behind. */
function PageRow({ moment, openerName, behind, isClicked = false }: DialogFieldProps) {
  return (
    <div className={styles.page}>
      <span className={styles.opener} data-target={moment.focus.kind === 'opener' || undefined}>
        {openerName}
      </span>
      {behind !== undefined && (
        <span className={list.next} data-target={moment.focus.kind === 'outside' || undefined}>
          {behind}
          {/* Where the click was made: at the control's place, on whatever covers it. */}
          {isClicked && <span className={styles.click} />}
        </span>
      )}
    </div>
  );
}

/** The open dialog: its name, what the tree says about being modal, and its controls. */
function DialogBox(props: DialogFieldProps) {
  const { moment } = props;
  return (
    <div className={styles.dialog} data-target={moment.focus.kind === 'dialog' || undefined}>
      <span className={styles.head}>
        <span className={styles.title} data-unnamed={moment.name === '' || undefined}>
          {moment.name || 'No name'}
        </span>
        {/* What the tree reports, not how the dialog behaves; nothing where it states nothing. */}
        {moment.isModal !== undefined && (
          <span className={styles.state}>{moment.isModal ? 'tree: modal' : 'tree: not modal'}</span>
        )}
      </span>
      <Controls {...props} />
    </div>
  );
}

/**
 * A schematic of one recorded moment of a modal dialog, not a picture of the system: the button
 * that opens it, the dialog with its name and what the tree says about being modal, its fields
 * and buttons in their recorded order, where focus is, and where a click on the page behind was
 * made. The dialog's room is kept while it is closed, so the drawing has one height at every
 * step. Hidden from assistive technology; the same facts are always written beside it.
 */
export function DialogField(props: DialogFieldProps) {
  const { moment, awaySide, size = 'md', isLive = false } = props;
  return (
    <div
      className={`${list.wrap} ${styles.wrap}`}
      data-size={size}
      data-live={isLive || undefined}
      // Focus fell to the document: the same red the other replays draw round the page.
      data-loss={moment.focus.kind === 'body' || undefined}
      aria-hidden="true"
    >
      {awaySide === 'before' && <Away moment={moment} />}
      <PageRow {...props} />
      <div className={styles.slot}>{moment.isOpen && <DialogBox {...props} />}</div>
      {awaySide === 'after' && <Away moment={moment} />}
    </div>
  );
}

interface DialogLegendProps {
  /** True where a recording clicks on the page behind. */
  hasClick?: boolean;
  /** True where a recording leaves the page. */
  leavesPage?: boolean;
  /** True where a recording ends with focus on the document. */
  hasLoss?: boolean;
  /** True where a drawing holds a control the recording never had focus on. */
  hasUnnamed?: boolean;
}

/** What a dialog replay's signs mean, in words, above its schematics. Only signs that occur. */
export function DialogLegend({ hasClick, leavesPage, hasLoss, hasUnnamed }: DialogLegendProps) {
  return (
    <ul className={list.legend} aria-label="Legend">
      <li className={list.legendItem}>
        <span className={styles.legendFocus} aria-hidden="true" />
        has focus
      </li>
      <li className={list.legendItem}>
        <span className={list.legendSpeech} aria-hidden="true">
          Aa
        </span>
        Said when focus lands
      </li>
      {hasUnnamed && (
        <li className={list.legendItem}>
          <span className={styles.legendUnnamed} aria-hidden="true" />
          in the dialog, not focused in this recording
        </li>
      )}
      {hasClick && (
        <li className={list.legendItem}>
          <span className={styles.legendClick} aria-hidden="true" />
          where the click was made; its place in this drawing is schematic
        </li>
      )}
      {leavesPage && (
        <li className={list.legendItem}>
          <span className={styles.legendAway} aria-hidden="true" />
          focus outside the page
        </li>
      )}
      {hasLoss && (
        <li className={list.legendItem}>
          <span className={styles.legendLoss} aria-hidden="true" />
          focus lost to the page
        </li>
      )}
    </ul>
  );
}
