import { endsOutsidePage, spokenLines, type ReplayStep } from './replay';

type Outcome =
  'removed a chip' | 'moved focus to a chip' | 'changed nothing in the accessibility tree';

/**
 * What one Backspace did in one system, as recorded, in the words the summary and each row's
 * label use. "Nothing in the accessibility tree", not "no change": the engine sees focus, the
 * tree and announcements, and a system may still mark a chip on screen (verdict audit
 * 2026-11-13). "Showed no change" read as nothing on screen, where Chakra UI highlights the last
 * tag (2026-11-25).
 */
export const backspaceOutcome = (step: ReplayStep | undefined): Outcome => {
  if (step && step.removed.length > 0) return 'removed a chip';
  if (step?.to.kind === 'chip') return 'moved focus to a chip';
  return 'changed nothing in the accessibility tree';
};

const order: readonly Outcome[] = [
  'removed a chip',
  'moved focus to a chip',
  'changed nothing in the accessibility tree',
];

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

/** How many different things one press did across the systems: the home page's finding. */
export const countOutcomes = (steps: readonly (ReplayStep | undefined)[]): number =>
  new Set(steps.map(backspaceOutcome)).size;

/**
 * Whether a recorded press was followed by no modelled line at all: nothing announced, and focus
 * did not move to something the model speaks. Said as "no modelled speech", never "silent": a
 * focused element's description can change ("3 selected" to "2 selected" in MUI), and whether a
 * screen reader speaks that is not measured (verdict audit 2026-11-25). Read from the recording,
 * as each lane's line is, never from a verdict (2026-11-25). A press that carried focus out of the page is not counted: what is
 * said there is not modelled.
 */
export const saysNothing = (step: ReplayStep | undefined): boolean =>
  step !== undefined &&
  !endsOutsidePage(step) &&
  step.heard.length === 0 &&
  spokenLines(step).length === 0;
