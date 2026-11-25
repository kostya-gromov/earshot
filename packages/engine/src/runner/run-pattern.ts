import { setTimeout } from 'node:timers/promises';
import {
  Measurement,
  type Run,
  type Scenario,
  type SystemVersion,
  type VerdictResult,
} from '@earshot/contracts';
import type { Adapter } from '../adapters/adapter.ts';
import type { Evaluator, EvaluatorInput } from '../model/evaluator.ts';
import { aggregateRuleVerdicts, summarizeRule } from '../model/rule-verdict.ts';
import { evaluateScenarioRuns } from '../model/run-results.ts';
import { readEnvironment } from '../provenance.ts';
import type { PatternSuite } from '../suites/types.ts';
import { executeRun } from './execute-run.ts';
import { notRunRuns } from './not-run.ts';

export interface PatternRunOptions {
  targetId: string;
  runs: number;
  headed: boolean;
}

export type PatternRunResult =
  | { status: 'measured'; measurement: Measurement }
  | { status: 'failed'; error: string; measurement?: Measurement };

interface ScenarioResult {
  scenario: Scenario;
  consistent: boolean;
  verdicts: Readonly<Record<string, VerdictResult>>;
  fatalErrors: readonly string[];
}

interface RunScenarioOptions<State, InteractionId extends string> {
  suite: PatternSuite<State, InteractionId>;
  adapter: Awaited<
    ReturnType<PatternSuite<State, InteractionId>['targets'][number]['open']>
  >['adapter'];
  definition: PatternSuite<State, InteractionId>['scenarios'][number];
  runOptions: PatternRunOptions;
}

/** One scenario as recorded, before anything is judged. */
interface ScenarioRecording {
  id: string;
  rules: readonly string[];
  runs: Run[];
  description: string;
  statesAgree: boolean;
}

async function recordScenario<State, InteractionId extends string>(
  options: RunScenarioOptions<State, InteractionId>,
): Promise<ScenarioRecording> {
  const notRun = notRunRuns(options.adapter, options.definition.id, options.runOptions.runs);
  if (notRun) {
    const { id, rules } = options.definition;
    return { id, rules, runs: notRun, description: 'Not run', statesAgree: true };
  }
  const executions = [];
  for (let index = 0; index < options.runOptions.runs; index += 1) {
    if (options.adapter.pauseBetweenRunsMs) await setTimeout(options.adapter.pauseBetweenRunsMs);
    executions.push(
      await executeRun(options.adapter, options.definition, options.runOptions.headed),
    );
  }
  const descriptions = executions.flatMap(({ actualStateDescription }) =>
    actualStateDescription ? [actualStateDescription] : [],
  );
  const description = descriptions[0] ?? 'Initial state was not reached';
  return {
    id: options.definition.id,
    rules: options.definition.rules,
    runs: executions.map(({ run }) => run),
    description,
    statesAgree: descriptions.every((value) => value === description),
  };
}

/** The first completed run of every scenario: what a rule may read beyond its own scenario. */
function recordedSteps(recordings: readonly { id: string; runs: readonly Run[] }[]) {
  return recordings.flatMap(({ id, runs }) => {
    const run = runs.find((candidate) => candidate.status === 'completed');
    return run?.status === 'completed' ? [{ scenarioId: id, steps: run.steps }] : [];
  });
}

const statesDisagreed: VerdictResult = {
  verdict: 'inconclusive',
  summary: 'Initial states disagreed',
  reason: 'Initial states disagreed between runs.',
};

/**
 * Judged only after every scenario is recorded: a rule may need to know what the component does
 * elsewhere (a text that also appears where nothing changed announces no change).
 */
function judgeScenario(
  recording: ScenarioRecording,
  evaluators: Readonly<Record<string, Evaluator>>,
  recorded: readonly EvaluatorInput[],
): ScenarioResult {
  const evaluation = evaluateScenarioRuns({
    scenarioId: recording.id,
    ruleIds: recording.rules,
    runs: recording.runs,
    evaluators,
    recorded,
  });
  return {
    scenario: {
      id: recording.id,
      rules: [...recording.rules],
      initialState: recording.description,
      runs: recording.runs,
    },
    consistent: evaluation.consistent && recording.statesAgree,
    verdicts: recording.statesAgree
      ? evaluation.verdicts
      : Object.fromEntries(recording.rules.map((ruleId) => [ruleId, statesDisagreed])),
    fatalErrors: evaluation.fatalErrors,
  };
}

function aggregateVerdicts<State, InteractionId extends string>(
  suite: PatternSuite<State, InteractionId>,
  results: readonly ScenarioResult[],
): Record<string, VerdictResult> {
  const recorded = recordedSteps(results.map(({ scenario }) => scenario));
  return Object.fromEntries(
    suite.pattern.rules.map(({ id }) => [
      id,
      suite.preconditions?.[id]?.(recorded) ??
        summarizeRule(
          aggregateRuleVerdicts(
            id,
            results.flatMap(({ scenario, verdicts, consistent }) =>
              scenario.rules.includes(id) && verdicts[id]
                ? [{ scenarioId: scenario.id, result: verdicts[id], reliable: consistent }]
                : [],
            ),
          ),
          suite.summaries?.[id],
        ),
    ]),
  );
}

/** What was measured: the system, its version, the page and the glue that drove it. */
function describeTarget<State, InteractionId extends string>(
  adapter: Adapter<State, InteractionId>,
  systemVersion: SystemVersion,
) {
  return {
    system: adapter.system,
    systemVersion,
    url: adapter.page ?? adapter.url,
    adapter: adapter.id,
    adapterVersion: adapter.version,
    itemsFoundBy: adapter.items.description,
  };
}

export async function runPattern<State, InteractionId extends string>(
  suite: PatternSuite<State, InteractionId>,
  options: PatternRunOptions,
): Promise<PatternRunResult> {
  const target = suite.targets.find(({ id }) => id === options.targetId);
  if (!target) return { status: 'failed', error: `Unknown target "${options.targetId}".` };
  const targetSession = await target.open();
  try {
    const environment = await readEnvironment(targetSession.adapter, options.headed);
    const recordings: ScenarioRecording[] = [];
    for (const scenario of suite.scenarios) {
      recordings.push(
        await recordScenario({
          suite,
          adapter: targetSession.adapter,
          definition: scenario,
          runOptions: options,
        }),
      );
    }
    const recorded = recordedSteps(recordings);
    const results = recordings.map((recording) =>
      judgeScenario(recording, suite.evaluators, recorded),
    );
    const measurement = Measurement.parse({
      schemaVersion: 1,
      pattern: suite.pattern.id,
      target: describeTarget(targetSession.adapter, environment.systemVersion),
      provenance: {
        status: 'measured',
        engineVersion: environment.engineVersion,
        browser: environment.browser,
        os: environment.os,
        measuredAt: new Date().toISOString(),
        runs: options.runs,
        consistent: results.every(({ consistent }) => consistent),
      },
      scenarios: results.map(({ scenario }) => scenario),
      verdicts: aggregateVerdicts(suite, results),
    });
    const fatalErrors = results.flatMap(({ fatalErrors }) => fatalErrors);
    return fatalErrors.length > 0
      ? { status: 'failed', error: fatalErrors.join('\n'), measurement }
      : { status: 'measured', measurement };
  } finally {
    await targetSession.close();
  }
}
