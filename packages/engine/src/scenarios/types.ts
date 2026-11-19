import type { Action } from '@earshot/contracts';

export type StepDefinition<InteractionId extends string> =
  Extract<Action, { type: 'press' | 'type' }> | { type: 'click'; target: InteractionId };

export interface ScenarioDefinition<State, InteractionId extends string> {
  id: string;
  rules: readonly string[];
  requestedStateDescription: string;
  initialState: State;
  /**
   * Where the steps start. Default: wherever the adapter's setup leaves focus (the input). With
   * "last-item", the runner then focuses the last of the adapter's items, the way a user who
   * reached a chip any way would be, so rules about the chips alone do not depend on how a
   * system joins them to the input.
   */
  startOn?: 'last-item';
  steps: readonly StepDefinition<InteractionId>[];
}
