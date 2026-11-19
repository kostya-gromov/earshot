import type { AxDiff, FocusInfo, Run, Step, VerdictResult } from '@earshot/contracts';
import type { Evaluator, EvaluatorInput } from './evaluator.ts';

interface ScenarioEvaluationOptions {
  scenarioId: string;
  ruleIds: readonly string[];
  runs: readonly Run[];
  evaluators: Readonly<Record<string, Evaluator>>;
  /** Every scenario of the measurement as recorded, for rules that look beyond their own. */
  recorded?: readonly EvaluatorInput[];
}

export interface ScenarioEvaluation {
  consistent: boolean;
  verdicts: Readonly<Record<string, VerdictResult>>;
  fatalErrors: readonly string[];
}

const refKey = ({ role, name }: { role: string | null; name: string }) =>
  `${role ?? ''}\u0000${name}`;
const changeKey = ({ node, property }: AxDiff['changed'][number]) =>
  `${refKey(node)}\u0000${property}`;

function normalizedFocus({ path: _, element: _number, ...focus }: FocusInfo) {
  return focus;
}

function normalizedDiff({ added, removed, changed }: AxDiff): AxDiff {
  return {
    added: [...added].sort((left, right) => refKey(left).localeCompare(refKey(right))),
    removed: [...removed].sort((left, right) => refKey(left).localeCompare(refKey(right))),
    changed: [...changed].sort((left, right) => changeKey(left).localeCompare(changeKey(right))),
  };
}

function normalizedStep(step: Step) {
  return {
    ...step,
    focusBefore: normalizedFocus(step.focusBefore),
    focusAfter: normalizedFocus(step.focusAfter),
    announcements: step.announcements.map(({ at: _, ...announcement }) => announcement),
    axDiff: normalizedDiff(step.axDiff),
    settle: { quiet: step.settle.quiet },
  };
}

const normalizedRun = (run: Extract<Run, { status: 'completed' }>) =>
  JSON.stringify(run.steps.map(normalizedStep));

const notCompleted: VerdictResult = {
  verdict: 'inconclusive',
  summary: 'Evaluation did not complete',
  reason: 'Evaluation did not complete.',
};

function inconclusive(
  ruleIds: readonly string[],
  { summary, reason }: { summary: string; reason: string },
): Readonly<Record<string, VerdictResult>> {
  return Object.fromEntries(
    ruleIds.map((ruleId) => [ruleId, { verdict: 'inconclusive', summary, reason }]),
  );
}

function evaluateRules(
  options: ScenarioEvaluationOptions,
  completed: readonly Extract<Run, { status: 'completed' }>[],
): Pick<ScenarioEvaluation, 'verdicts' | 'fatalErrors'> {
  const verdicts: Record<string, VerdictResult> = {};
  const fatalErrors: string[] = [];
  for (const ruleId of options.ruleIds) {
    const evaluator = options.evaluators[ruleId];
    if (!evaluator) {
      fatalErrors.push(`${ruleId}: Evaluator is missing`);
      verdicts[ruleId] = notCompleted;
      continue;
    }
    try {
      const results = completed.map(({ steps }) =>
        evaluator({
          scenarioId: options.scenarioId,
          steps,
          ...(options.recorded ? { recorded: options.recorded } : {}),
        }),
      );
      const first = results[0]!;
      verdicts[ruleId] = results.every((result) => JSON.stringify(result) === JSON.stringify(first))
        ? first
        : {
            verdict: 'inconclusive',
            summary: 'Runs disagreed',
            reason: 'flaky: evaluator results disagreed.',
          };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      fatalErrors.push(`${ruleId}: ${message}`);
      verdicts[ruleId] = notCompleted;
    }
  }
  return { verdicts, fatalErrors };
}

/**
 * Every run failed setup with the same reason: a repeatable outcome, not flakiness, so it is
 * consistent and its own reason is kept (changed 2026-11-10).
 */
function sameSetupFailure(runs: readonly Run[]): string | undefined {
  const reasons = runs.map((run) => (run.status === 'setup-failed' ? run.reason : undefined));
  const [first] = reasons;
  if (first === undefined || reasons.some((reason) => reason !== first)) return undefined;
  return first;
}

export function evaluateScenarioRuns(options: ScenarioEvaluationOptions): ScenarioEvaluation {
  const completed = options.runs.filter(
    (run): run is Extract<Run, { status: 'completed' }> => run.status === 'completed',
  );
  const repeatedSetupFailure = sameSetupFailure(options.runs);
  if (repeatedSetupFailure !== undefined) {
    return {
      consistent: true,
      verdicts: inconclusive(options.ruleIds, {
        summary: 'Could not reach the starting state',
        reason: repeatedSetupFailure,
      }),
      fatalErrors: [],
    };
  }
  if (completed.length !== options.runs.length) {
    return {
      consistent: false,
      verdicts: inconclusive(options.ruleIds, {
        summary: 'Setup or a run did not complete',
        reason: 'Scenario setup or execution did not complete.',
      }),
      fatalErrors: [],
    };
  }
  const first = completed[0];
  if (!first || completed.some((run) => normalizedRun(run) !== normalizedRun(first))) {
    return {
      consistent: false,
      verdicts: inconclusive(options.ruleIds, {
        summary: 'Runs disagreed',
        reason: 'flaky: normalized observations disagreed.',
      }),
      fatalErrors: [],
    };
  }
  const evaluated = evaluateRules(options, completed);
  return { consistent: evaluated.fatalErrors.length === 0, ...evaluated };
}
