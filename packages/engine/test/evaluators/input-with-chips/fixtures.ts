import type { FocusInfo, Step } from '@earshot/contracts';
import type { EvaluatorInput } from '../../../src/model/evaluator.ts';

export function focus(overrides: Partial<FocusInfo> = {}): FocusInfo {
  return {
    role: 'combobox',
    name: 'To',
    states: {},
    isBody: false,
    isInsideComponent: true,
    path: '#to',
    ...overrides,
  };
}

export function step(overrides: Partial<Step> = {}): Step {
  return {
    action: { type: 'press', key: 'Backspace' },
    focusBefore: focus(),
    focusAfter: focus(),
    announcements: [],
    axDiff: { added: [], removed: [], changed: [] },
    settle: { ms: 20, quiet: true },
    speech: [],
    ...overrides,
  };
}

export function evaluatorInput(scenarioId: string, steps: readonly Step[]): EvaluatorInput {
  return { scenarioId, steps };
}

/**
 * A system that shares none of the reference's naming: chips say "Clear …", the input is a
 * plain textbox. Evaluators must judge it by structure alone.
 */
export const otherSystem = {
  input: focus({ role: 'textbox', name: 'Recipients', path: '#recipients' }),
  chip: (position: number, size = 3): FocusInfo =>
    focus({
      role: 'button',
      name: `Clear person ${position}`,
      posInSet: position,
      setSize: size,
      path: `#clear-${position}`,
    }),
  removedChip: (position: number) => [
    { role: 'StaticText', name: `person ${position}` },
    { role: 'button', name: `Clear person ${position}` },
  ],
};

export function removeFocus(position: number, size = 3): FocusInfo {
  return focus({
    role: 'button',
    name: `Remove item ${position}`,
    posInSet: position,
    setSize: size,
    path: `#remove-${position}`,
  });
}
