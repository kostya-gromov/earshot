import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { differs, incomplete, isShown, notJudged, observedSteps } from './facts.ts';
import type { ObservedStep } from './facts.ts';

/**
 * What the button said after a step. `absent`: the button was not in the accessibility tree, so
 * nothing was said and the step is not judged. `unstated`: it was there with no expanded state.
 */
type Said = 'expanded' | 'collapsed' | 'unstated' | 'absent';

function saidAfter({ after }: ObservedStep): Said {
  const { opener } = after.popup;
  if (!opener) return 'absent';
  if (opener.states.expanded === undefined) return 'unstated';
  return opener.states.expanded ? 'expanded' : 'collapsed';
}

const shownWord = (observed: ObservedStep) => (isShown(observed.after.popup) ? 'shown' : 'hidden');
const isMatch = (observed: ObservedStep) =>
  saidAfter(observed) === (isShown(observed.after.popup) ? 'expanded' : 'collapsed');
const isJudged = (observed: ObservedStep) => saidAfter(observed) !== 'absent';

function describeAction({ step }: ObservedStep): string {
  if (step.action.type === 'press') return step.action.key;
  return step.action.type === 'type' ? `typing "${step.action.text}"` : 'a click';
}

function describeWrong(wrong: ObservedStep, place: number): VerdictResult {
  const where = `After step ${place} (${describeAction(wrong)}),`;
  const said = saidAfter(wrong);
  if (said === 'unstated') {
    // APG: "When the menu is hidden, aria-expanded is set to false." No state is not false.
    return differs(
      'Button has no expanded state',
      `${where} the button was in the accessibility tree with no expanded state while the menu was ${shownWord(wrong)}.`,
    );
  }
  return differs(
    'Expanded does not match the menu',
    `${where} the button was exposed as ${said} while the menu was ${shownWord(wrong)}.`,
  );
}

const count = (steps: number) => (steps === 1 ? '1 step' : `${steps} steps`);

/** Which of the two states were read anywhere in the measurement, this scenario included. */
function statesRead(input: EvaluatorInput, own: readonly ObservedStep[]) {
  const all = (input.recorded ?? []).flatMap((scenario) => observedSteps(scenario, 1) ?? []);
  const judged = [...own, ...all].filter(isJudged);
  return {
    whileShown: judged.some((observed) => isShown(observed.after.popup)),
    whileHidden: judged.some((observed) => !isShown(observed.after.popup)),
  };
}

/** One of the two states was never readable: say what was read here and what was not. */
function halfRead(steps: readonly ObservedStep[], missing: 'shown' | 'hidden'): VerdictResult {
  const judged = steps.filter(isJudged).length;
  const read = missing === 'shown' ? 'hidden' : 'shown';
  const here =
    judged === 0
      ? `The button was not in the accessibility tree after ${steps.length === 1 ? 'the one step' : `any of the ${steps.length} steps`} here.`
      : `The button's expanded state matched the menu after ${count(judged)}, all with the menu ${read}.`;
  return {
    ...notJudged(
      `Expanded read only while the menu is ${read}`,
      `${here} In no scenario was the button in the accessibility tree while the menu was ${missing}, so that state was never read.`,
    ),
    judgedSteps: judged,
  };
}

/**
 * APG: aria-expanded on the button is true while the menu is displayed and false while it is
 * hidden. Judged after every step in which the button is in the accessibility tree. A button
 * that is there without the state differs. The rule follows only when both states were read
 * somewhere in the measurement: one state alone does not show that the button tells them apart
 * (2026-11-16).
 */
export function evaluateExpanded(input: EvaluatorInput): VerdictResult {
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  const wrong = steps.find((observed) => isJudged(observed) && !isMatch(observed));
  if (wrong) return describeWrong(wrong, steps.indexOf(wrong) + 1);
  const { whileShown, whileHidden } = statesRead(input, steps);
  if (!whileShown && !whileHidden) {
    return notJudged(
      'Button not in the accessibility tree',
      'The button was not in the accessibility tree after any step, so nothing was judged.',
    );
  }
  if (!whileShown) return halfRead(steps, 'shown');
  if (!whileHidden) return halfRead(steps, 'hidden');
  const judged = steps.filter(isJudged).length;
  if (judged === 0) {
    return notJudged(
      'Button not in the accessibility tree',
      'The button was not in the accessibility tree after any step of this scenario, so nothing was judged here.',
    );
  }
  const each = judged === 1 ? 'the one step' : `each of the ${judged} steps`;
  return {
    verdict: 'follows',
    summary: 'Expanded matches the menu',
    reason: `The button's expanded state matched whether the menu was shown after ${each} judged (${steps.length - judged} not judged).`,
    judgedSteps: judged,
  };
}
