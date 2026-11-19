import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeItem,
  describeItem,
  differs,
  enterOnItem,
  incomplete,
  isPress,
  isShown,
  notJudged,
  observedSteps,
  ranAnAction,
  unsupported,
  type ObservedStep,
} from './facts.ts';

/** The last Down Arrow before Enter: after it the active item should be the disabled one. */
const lastDown = (steps: readonly ObservedStep[]) =>
  steps.findLast((observed) => isPress(observed.step, 'ArrowDown'));

interface DisabledItem {
  name: string;
  index: number;
  count: number;
}

/** The disabled item as the open menu exposes it; undefined when no item says it is disabled. */
function exposedDisabled({ after }: ObservedStep): DisabledItem | undefined {
  const items = after.popup.options;
  const index = items.findIndex(({ states }) => states.disabled === true);
  const item = items[index];
  return item ? { name: item.name, index, count: items.length } : undefined;
}

/** After the arrows: the active item should be the disabled one, not the item after it. */
function skipped(down: ObservedStep, disabled: DisabledItem): VerdictResult | undefined {
  const reached = activeItem(down.after);
  if (reached?.index === disabled.index) return undefined;
  const landed = reached ? describeItem(reached, disabled.count) : 'no item';
  return differs(
    'Arrows skip the disabled item',
    `Down Arrow at the place of the disabled "${disabled.name}" made ${landed} active.`,
  );
}

/**
 * Atlas recommendation, from an APG note: a disabled item is focusable and cannot be activated.
 * "Not activated" is read from the page; whether the menu closes on that Enter is recorded and
 * not judged, because APG does not say.
 */
export function evaluateDisabled(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'disabled') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 4);
  if (!steps) return incomplete;
  const down = lastDown(steps);
  const enter = enterOnItem(steps);
  if (!down || !enter || !isShown(down.after.popup)) {
    return notJudged('Menu not shown', 'The menu was not shown at the disabled item’s place.');
  }
  const disabled = exposedDisabled(down);
  if (!disabled) {
    return differs(
      'No item is exposed as disabled',
      `None of the ${down.after.popup.options.length} items in the menu was exposed as disabled.`,
    );
  }
  const skip = skipped(down, disabled);
  if (skip) return skip;
  if (ranAnAction(enter)) {
    return differs(
      'Enter activates the disabled item',
      `Enter on the disabled "${disabled.name}" changed the page to "${enter.after.effect}".`,
    );
  }
  const menu = isShown(enter.after.popup) ? 'stayed open' : 'closed';
  return {
    verdict: 'follows',
    summary: 'Disabled item reached, not activated',
    reason: `The arrows reached "${disabled.name}", it was exposed as disabled, and Enter on it ran no action. The menu ${menu} (recorded, not judged).`,
  };
}
