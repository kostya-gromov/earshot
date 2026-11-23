/** Consecutive presses of one key in a recording, drawn once with a count. */
export interface KeyRun {
  key: string;
  /** The index of the run's first press among the recording's steps. */
  start: number;
  count: number;
}

/**
 * A recording's keys with repeats of the same key folded into runs: four presses of Shift+Tab
 * are one key and a count. A long scenario's row of keys was wider than a phone, and the page
 * scrolled sideways (WCAG 1.4.10 Reflow; design review, 2026-11-22).
 */
export function keyRuns(keys: readonly string[]): KeyRun[] {
  const runs: KeyRun[] = [];
  keys.forEach((key, index) => {
    const last = runs.at(-1);
    if (last && last.key === key) last.count += 1;
    else runs.push({ key, start: index, count: 1 });
  });
  return runs;
}

/** Where the press at `index` stands in its run: 0 before the run, `count` once it is past. */
export function pressesDone(run: KeyRun, index: number): number {
  return Math.min(Math.max(index - run.start + 1, 0), run.count);
}
