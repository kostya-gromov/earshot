import type { Pattern } from '@earshot/contracts';
import type { Adapter } from '../adapters/adapter.ts';
import type { Evaluator, Precondition } from '../model/evaluator.ts';
import type { ScenarioDefinition } from '../scenarios/types.ts';

export interface TargetSession<State, InteractionId extends string> {
  adapter: Adapter<State, InteractionId>;
  close: () => Promise<void>;
}

export interface TargetFactory<State, InteractionId extends string> {
  id: string;
  open: () => Promise<TargetSession<State, InteractionId>>;
}

export interface PatternSuite<State, InteractionId extends string> {
  pattern: Pattern;
  scenarios: readonly ScenarioDefinition<State, InteractionId>[];
  evaluators: Readonly<Record<string, Evaluator>>;
  /** Rules judged only when other scenarios show the design they presume (see Precondition). */
  preconditions?: Readonly<Record<string, Precondition>>;
  /**
   * A rule's verdict in the rule's own words, used when every scenario that covers it follows:
   * for a rule whose scenarios each press one key and say what that key did (summarizeRule).
   */
  summaries?: Readonly<Record<string, string>>;
  targets: readonly TargetFactory<State, InteractionId>[];
}
