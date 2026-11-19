import type { Step } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { chipPosition } from './facts.ts';

const tabScenarios: ReadonlySet<string> = new Set(['chip-tab', 'chip-shift-tab']);

/** The chip positions when a step moved focus from one chip to a different chip. */
export function chipToChip(step: Step | undefined) {
  const from = step && chipPosition(step.focusBefore);
  const to = step && chipPosition(step.focusAfter);
  return from && to && to.position !== from.position ? { from, to } : undefined;
}

export interface TabBetweenChips {
  scenarioId: string;
  key: string;
  from: number;
  to: number;
}

/** The first Tab or Shift+Tab that went from one chip to another: each chip is its own stop. */
export function tabBetweenChips(scenarios: readonly EvaluatorInput[]): TabBetweenChips | undefined {
  for (const { scenarioId, steps } of scenarios) {
    const moved = tabScenarios.has(scenarioId) ? chipToChip(steps[0]) : undefined;
    if (!moved) continue;
    const key = steps[0]?.action.type === 'press' ? steps[0].action.key : 'Tab';
    return { scenarioId, key, from: moved.from.position, to: moved.to.position };
  }
  return undefined;
}

/** Undefined when the arrows were not recorded: then nothing is concluded from them. */
function arrowsMoveBetweenChips(scenarios: readonly EvaluatorInput[]): boolean | undefined {
  const arrows = scenarios.find(({ scenarioId }) => scenarioId === 'chip-arrows');
  if (!arrows) return undefined;
  return chipToChip(arrows.steps[0]) !== undefined;
}

/**
 * Chips that are separate controls in the tab sequence, with no arrow keys between them: what
 * APG allows outside a composite widget (verdict audit 2026-11-11, B1; the owner chose to read
 * "one widget" from behaviour, since the reference's own chips carry no composite role).
 */
export function separateControls(
  scenarios: readonly EvaluatorInput[],
): TabBetweenChips | undefined {
  const tab = tabBetweenChips(scenarios);
  if (!tab || arrowsMoveBetweenChips(scenarios) !== false) return undefined;
  return tab;
}

/** The reason both chip rules give when the chips are separate controls. */
export const separateControlsReason = ({ scenarioId, key, from, to }: TabBetweenChips): string =>
  `In ${scenarioId}, ${key} moved from chip ${from} to chip ${to}, and Left Arrow did not move between chips: the chips are separate controls in the tab sequence, not one composite widget. APG asks for one Tab stop only inside a composite widget and allows controls in the tab sequence. "One stop for the whole field" judges the extra stops.`;
