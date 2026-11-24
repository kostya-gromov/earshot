import type { Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  judgeChangeAnnouncement,
  saidTexts,
  textsSeenWithout,
  type ChangeAnnouncement,
  type RecordedScenario,
} from '../../model/change-announcement.ts';
import {
  activeOption,
  incomplete,
  isShown,
  notJudged,
  observedSteps,
  unsupported,
  type ObservedStep,
} from './facts.ts';

/** A step changed the suggestions when its list of options is not the one before it. */
function listChanged({ popup }: Step): boolean {
  if (!popup) return false;
  const shown = ({ present, options }: typeof popup.before) =>
    present ? options.map(({ name }) => name).join('\u0000') : undefined;
  return shown(popup.before) !== shown(popup.after);
}

/**
 * Whether the change of the suggestions is announced, by the rule every pattern shares (model/
 * change-announcement.ts). Any text names it here: what the message says is the next rule's
 * question. A text that live regions also held in a step that left the list as it was, anywhere
 * in the recording, is not an announcement of the change. A region that enters the page with
 * its text is read like any other; the reason says how the text arrived.
 */
export function suggestionsAnnouncement(
  step: Step,
  recorded: readonly RecordedScenario[],
): ChangeAnnouncement {
  return judgeChangeAnnouncement({
    step,
    names: () => true,
    seenWithout: textsSeenWithout(recorded, listChanged),
    change: { noun: 'change of the suggestions', named: 'the change' },
  });
}

/**
 * The step both announcement rules judge: the first key typed in `type-then-move`, which must
 * be seen to change the suggestions. Text that matches nothing (`no-match`) is recorded and not
 * judged by either rule: APG lets the popup simply close.
 */
export function typingStep(input: EvaluatorInput): ObservedStep | VerdictResult {
  if (input.scenarioId !== 'type-then-move') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  const typed = steps?.find(({ step }) => step.action.type === 'type');
  if (!typed) return incomplete;
  if (!isShown(typed.after.popup)) {
    return notJudged(
      'Typing shows no suggestions',
      'Typing did not put options in the tree, so the engine could not see the suggestions change.',
    );
  }
  return typed;
}

/** With nothing written to a live region: what the step shows instead, or that it differs. */
function judgeSilence(typed: ObservedStep): VerdictResult {
  const active = activeOption(typed.after);
  if (active && !activeOption(typed.before)) {
    return notJudged(
      'Typing makes the first match active',
      `Nothing was written to a live region, and the typed key made "${active.name}" the active option of ${typed.after.popup.options.length}. An active option tells the change another way, so the rule is not judged.`,
    );
  }
  return {
    verdict: 'differs',
    summary: 'Change is not announced',
    reason:
      'Nothing was written to a live region within the quiet window after the key that changed the suggestions, and no option became active.',
  };
}

/** Earshot recommendation: when typing changes the suggestions, a live region says so. */
export function evaluateSayResults(input: EvaluatorInput): VerdictResult {
  const typed = typingStep(input);
  if ('verdict' in typed) return typed;
  const announcement = suggestionsAnnouncement(typed.step, input.recorded ?? []);
  switch (announcement.kind) {
    case 'silent':
      return judgeSilence(typed);
    case 'not-counted':
      return {
        verdict: 'differs',
        summary: 'Change is not announced',
        reason: announcement.reason,
      };
    case 'undetermined':
      return notJudged('Announcement could not be judged', announcement.reason);
    case 'announced':
      return {
        verdict: 'follows',
        summary: 'Change is announced',
        reason: `After the key that changed the suggestions, a live region said ${saidTexts(announcement.texts)}.`,
      };
  }
}
