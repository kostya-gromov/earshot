import type { Step, VerdictResult } from '@earshot/contracts';

export interface EvaluatorInput {
  scenarioId: string;
  steps: readonly Step[];
  /**
   * Every scenario of the measurement as recorded, this one included. For a rule that has to
   * know what a component does elsewhere: a text that also appears where nothing changed is not
   * the announcement of a change. Absent when a scenario is judged on its own.
   */
  recorded?: readonly EvaluatorInput[];
}

export type Evaluator = (input: EvaluatorInput) => VerdictResult;

/**
 * A rule that only applies when another scenario showed a design it presumes: given every
 * scenario's recorded steps, it returns the verdict to use instead, or undefined to judge as usual.
 */
export type Precondition = (scenarios: readonly EvaluatorInput[]) => VerdictResult | undefined;
