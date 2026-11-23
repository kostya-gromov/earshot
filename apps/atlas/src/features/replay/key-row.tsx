import { keyRuns, pressesDone, type KeyRun } from '@/lib/key-runs';
import { Keycap } from '@/ui';
import styles from './key-row.module.css';

interface KeyRowProps {
  /** The keys of the recording's steps, in order. */
  keys: readonly string[];
  /** The step the replay is at; below zero before the first. */
  index: number;
  /** True where keys already pressed are dimmed (the comparison, which plays on one clock). */
  dimsDone?: boolean;
}

/** "2 of 4" while the run is being pressed, "×4" before and after. */
function Count({ run, index }: { run: KeyRun; index: number }) {
  const done = pressesDone(run, index);
  const isCurrent = index >= run.start && index < run.start + run.count;
  // Both texts in one cell: the count keeps the wider one's width, so the row never moves.
  return (
    <span className={styles.count} data-current={isCurrent || undefined}>
      <span data-shown={!isCurrent || undefined}>×{run.count}</span>
      <span data-shown={isCurrent || undefined}>
        {done} of {run.count}
      </span>
    </span>
  );
}

/**
 * A recording's keys in one row, a key pressed several times in a row drawn once with a count.
 * Hidden from assistive technology by its caller: every step is written out beside the drawing.
 */
export function KeyRow({ keys, index, dimsDone = false }: KeyRowProps) {
  return (
    <>
      {keyRuns(keys).map((run) => {
        const isCurrent = index >= run.start && index < run.start + run.count;
        const isDone = dimsDone && index >= run.start + run.count;
        // In a run of several presses the key is drawn anew for each: its short press starts
        // again, so a press is seen as a press and not only as a digit changing.
        const press = isCurrent && run.count > 1 ? pressesDone(run, index) : 0;
        return (
          <span key={run.start} className={styles.run} data-pressing={press > 0 || undefined}>
            {/* Only the key is dimmed once pressed: the count is text and keeps its contrast.
                The wrapper is there only where keys dim, as it was before keys were folded:
                each row keeps the height it had. */}
            {dimsDone ? (
              <span key={press} data-done={isDone || undefined}>
                <Keycap keys={run.key} pressed={isCurrent} />
              </span>
            ) : (
              <Keycap key={press} keys={run.key} pressed={isCurrent} />
            )}
            {run.count > 1 && <Count run={run} index={index} />}
          </span>
        );
      })}
    </>
  );
}
