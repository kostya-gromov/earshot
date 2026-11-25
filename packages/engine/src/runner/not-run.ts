import type { Run } from '@earshot/contracts';

/**
 * The runs of a scenario the adapter declares out of its reach (engine 0.23.0): "not run" in
 * each, with the adapter's reason, so a missing recording is never read as behavior. Undefined
 * for a scenario the adapter runs.
 */
export function notRunRuns(
  adapter: { notRun?: { scenarios: readonly string[]; reason: string } },
  scenarioId: string,
  count: number,
): Run[] | undefined {
  const { notRun } = adapter;
  if (!notRun?.scenarios.includes(scenarioId)) return undefined;
  return Array.from({ length: count }, () => ({ status: 'not-run', reason: notRun.reason }));
}
