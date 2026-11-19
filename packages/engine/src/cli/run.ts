import type { Measurement } from '@earshot/contracts';
import { registeredPatterns } from '../registry/index.ts';
import { writeMeasurement } from './write-measurement.ts';

export interface RunCommandOptions {
  patternId: string;
  targetId: string;
  runs: number;
  headed: boolean;
  output?: string;
}

export interface RunCommandResult {
  file: string;
  measurement: Measurement;
}

export const defaultMeasurementPath = (patternId: string, targetId: string): string =>
  `data/measurements/${patternId}/${targetId}.json`;

export async function runCommand(options: RunCommandOptions): Promise<RunCommandResult> {
  const registration = registeredPatterns.get(options.patternId);
  if (!registration) throw new Error(`Unknown pattern "${options.patternId}".`);
  if (!registration.targetIds.includes(options.targetId)) {
    throw new Error(`Unknown target "${options.targetId}" for pattern "${options.patternId}".`);
  }
  if (!Number.isInteger(options.runs) || options.runs < 1) {
    throw new Error(`Runs must be a positive integer, received "${options.runs}".`);
  }

  const result = await registration.run({
    targetId: options.targetId,
    runs: options.runs,
    headed: options.headed,
  });
  if (result.status === 'failed') throw new Error(result.error);

  const file = options.output ?? defaultMeasurementPath(options.patternId, options.targetId);
  await writeMeasurement(result.measurement, registration.pattern, file);
  return { file, measurement: result.measurement };
}

export type RunAllResult = { targetId: string; file: string } | { targetId: string; error: string };

export interface RunAllOptions {
  patternId: string;
  runs: number;
  headed: boolean;
  /** Measures one target; the real command by default, replaced in tests. */
  runOne?: (options: RunCommandOptions) => Promise<RunCommandResult>;
  /** Waits between targets; a few seconds by default. */
  pause?: () => Promise<void>;
}

const pauseMs = 3000;
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, pauseMs));

/**
 * Every target of a pattern, one at a time with a short pause between them (packages/engine/CLAUDE.md, Targets and conduct: a
 * polite rate, no parallel runs). A target that fails is reported and the rest are still
 * measured, so one broken page does not hide the others.
 */
export async function runAllCommand(options: RunAllOptions): Promise<RunAllResult[]> {
  const registration = registeredPatterns.get(options.patternId);
  if (!registration) throw new Error(`Unknown pattern "${options.patternId}".`);
  const { runOne = runCommand, pause = wait } = options;
  const results: RunAllResult[] = [];
  for (const [index, targetId] of registration.targetIds.entries()) {
    if (index > 0) await pause();
    try {
      const { file } = await runOne({ ...options, targetId });
      results.push({ targetId, file });
    } catch (error) {
      results.push({ targetId, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}
