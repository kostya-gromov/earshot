import type { ReplayStep } from './replay';

type Outcome = 'removed a chip' | 'moved focus to a chip' | 'showed no change';

/**
 * What one Backspace did in one system, in the words the summary and each row's label use.
 * "Showed no change", not "changed nothing": the engine sees focus, the accessibility tree and
 * announcements, and a system may still mark a chip on screen (verdict audit 2026-11-13).
 */
export const backspaceOutcome = (step: ReplayStep | undefined): Outcome => {
  if (step && step.removed.length > 0) return 'removed a chip';
  if (step?.to.kind === 'chip') return 'moved focus to a chip';
  return 'showed no change';
};

const order: readonly Outcome[] = ['removed a chip', 'moved focus to a chip', 'showed no change'];

/**
 * What one Backspace did in every system, in one sentence a screen reader can say after the
 * press: five lanes changing at once say nothing on their own.
 */
export function summarizeBackspace(steps: readonly (ReplayStep | undefined)[]): string {
  const outcomes = steps.map(backspaceOutcome);
  const parts = order
    .map((outcome) => [outcomes.filter((o) => o === outcome).length, outcome] as const)
    .filter(([count]) => count > 0)
    .map(([count, outcome]) => `${count} ${outcome}`);
  return `Backspace pressed in ${steps.length} systems: ${parts.join(', ')}.`;
}
