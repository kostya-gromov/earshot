import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  describeFocus,
  incomplete,
  isCombobox,
  isOutsideComponent,
  isShown,
  notJudged,
  observedSteps,
  unsupported,
  type Moment,
  type ObservedStep,
} from './facts.ts';

const onPopup = ({ focus }: Moment): boolean => !!focus.item || focus.role === 'listbox';

/** Where Tab from the combobox went: the popup or its open button differs, another control is not judged. */
function judgeTab(
  { after }: ObservedStep,
  { state, input }: { state: string; input: EvaluatorInput },
): VerdictResult | undefined {
  if (onPopup(after)) {
    return {
      verdict: 'differs',
      summary: 'Tab lands in the popup',
      reason: `With the popup ${state}, Tab moved focus to ${describeFocus(after.focus)}, which is part of the popup.`,
    };
  }
  if (isOutsideComponent(after.focus)) return undefined;
  if (isCombobox(after.focus, input)) {
    return notJudged(
      'Tab keeps focus in the combobox',
      `With the popup ${state}, Tab left focus on the combobox itself. Where a second Tab goes was not recorded, so the step is not judged.`,
    );
  }
  // A button that exposes an expanded state is the one that opens the popup.
  if (after.focus.states.expanded !== undefined) {
    return {
      verdict: 'differs',
      summary: 'Tab stops on the open button',
      reason: `With the popup ${state}, Tab moved focus to ${describeFocus(after.focus)}, which exposes an expanded state: the button that opens the popup. APG keeps it out of the Tab sequence.`,
    };
  }
  return notJudged(
    'Tab stops on another control',
    `With the popup ${state}, Tab moved focus to ${describeFocus(after.focus)}. It exposes no expanded state, so the engine cannot tell whether it opens the popup or is a control APG does not name; the stop is recorded and not judged.`,
  );
}

function judgeTabOut(input: EvaluatorInput): VerdictResult {
  const steps = observedSteps(input, 2);
  const [tab, back] = steps ?? [];
  if (!tab || !back) return incomplete;
  const forward = judgeTab(tab, { state: 'closed', input });
  if (forward) return forward;
  if (!isCombobox(back.after.focus, input)) {
    return {
      verdict: 'differs',
      summary: 'Shift+Tab does not return to the combobox',
      reason: `Tab left the combobox; Shift+Tab then moved focus to ${describeFocus(back.after.focus)}, not back to the combobox.`,
    };
  }
  return {
    verdict: 'follows',
    summary: 'One Tab stop',
    reason: 'With the popup closed, Tab left the combobox and Shift+Tab returned to it.',
  };
}

function judgeTabOpen(input: EvaluatorInput): VerdictResult {
  const steps = observedSteps(input, 3);
  const tab = steps?.[2];
  if (!tab) return incomplete;
  if (!isShown(tab.before.popup)) {
    return notJudged(
      'Popup not shown',
      'The popup was not shown before Tab, so nothing was judged.',
    );
  }
  if (!isCombobox(tab.before.focus, input)) {
    return notJudged(
      'Focus was on an option',
      `Before Tab, DOM focus was on ${describeFocus(tab.before.focus)}, not on the combobox. "Focus stays in the combobox" covers it.`,
    );
  }
  return (
    judgeTab(tab, { state: 'shown', input }) ?? {
      verdict: 'follows',
      summary: 'Tab skips the popup',
      reason:
        'With the popup shown, Tab left the combobox without stopping on the popup or an option.',
    }
  );
}

/** APG: the combobox is in the Tab sequence; the popup and its descendants are not. */
export function evaluateTab(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId === 'tab-out') return judgeTabOut(input);
  if (input.scenarioId === 'tab-open') return judgeTabOpen(input);
  return unsupported(input.scenarioId);
}
