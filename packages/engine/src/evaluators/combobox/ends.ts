import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeOption,
  isCombobox,
  isPress,
  isShown,
  notJudged,
  type ObservedStep,
} from './facts.ts';

type EndBehaviour = 'stays' | 'returns to the combobox' | 'wraps';

interface End {
  key: 'ArrowDown' | 'ArrowUp';
  /** The option the key is pressed on, and the one a wrap leads to. */
  from: (count: number) => number;
  wrapsTo: (count: number) => number;
  label: string;
}

const last: End = {
  key: 'ArrowDown',
  from: (count) => count - 1,
  wrapsTo: () => 0,
  label: 'Down Arrow at the last option',
};
const first: End = {
  key: 'ArrowUp',
  from: () => 0,
  wrapsTo: (count) => count - 1,
  label: 'Up Arrow at the first option',
};

/** The first press of the key while the end option is active. */
const stepAt = (steps: readonly ObservedStep[], end: End): ObservedStep | undefined =>
  steps.find(({ step, before }) => {
    const active = activeOption(before);
    return isPress(step, end.key) && active?.index === end.from(before.popup.options.length);
  });

/** APG names staying and returning to the combobox; its list example wraps. All three follow. */
function behaviourAt(
  { before, after }: ObservedStep,
  end: End,
  input: EvaluatorInput,
): EndBehaviour | undefined {
  const count = before.popup.options.length;
  const to = activeOption(after);
  if (to?.index === end.from(count)) return 'stays';
  if (to?.index === end.wrapsTo(count)) return 'wraps';
  if (!to && isShown(after.popup) && isCombobox(after.focus, input)) {
    return 'returns to the combobox';
  }
  return undefined;
}

function describeOutcome({ after }: ObservedStep): string {
  const to = activeOption(after);
  if (to) return `option ${to.index + 1}, "${to.name}", became active`;
  return isShown(after.popup) ? 'no option was active' : 'the popup closed';
}

export function judgeEnds(steps: readonly ObservedStep[], input: EvaluatorInput): VerdictResult {
  const seen: string[] = [];
  for (const end of [last, first]) {
    const step = stepAt(steps, end);
    if (!step) continue;
    const behaviour = behaviourAt(step, end, input);
    if (!behaviour) {
      return {
        verdict: 'differs',
        summary: 'Unexpected move at the end of the list',
        reason: `${end.label}: ${describeOutcome(step)}. APG names staying and returning to the combobox, and its list example wraps.`,
      };
    }
    seen.push(`${end.label} ${behaviour}`);
  }
  if (seen.length === 0) {
    return notJudged(
      'No end of the list reached',
      'The keys never reached the first or the last option while it was active, so the ends were not judged.',
    );
  }
  return {
    verdict: 'follows',
    summary: 'Ends of the list as APG allows',
    reason: `${seen.join('; ')}.`,
  };
}
