import type { Pattern } from '@earshot/contracts';
import { debugPattern, type PatternDebugOptions } from '../cli/debug-pattern.ts';
import {
  runPattern,
  type PatternRunOptions,
  type PatternRunResult,
} from '../runner/run-pattern.ts';
import type { PatternSuite } from '../suites/types.ts';

export interface RegisteredPattern {
  pattern: Pattern;
  scenarioIds: readonly string[];
  targetIds: readonly string[];
  run: (options: PatternRunOptions) => Promise<PatternRunResult>;
  debug: (options: PatternDebugOptions) => Promise<void>;
}

export function registerPattern<State, InteractionId extends string>(
  suite: PatternSuite<State, InteractionId>,
): RegisteredPattern {
  return {
    pattern: suite.pattern,
    scenarioIds: suite.scenarios.map(({ id }) => id),
    targetIds: suite.targets.map(({ id }) => id),
    run: (options) => runPattern(suite, options),
    debug: (options) => debugPattern(suite, options),
  };
}
