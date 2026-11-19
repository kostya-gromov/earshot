import { notJudgedSteps, type ScenarioResult } from './scenario-groups';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** No step of the scenario was judged: it was recorded and confirms nothing about the rule. */
const isUnjudged = ({ judgedSteps }: ScenarioResult) => judgedSteps === 0;

/**
 * What a fold holds, before it is opened. "7 more scenarios, same result, 26 steps judged": the
 * steps are the ones the engine says it judged, from the file, summed. Scenarios in which no
 * step was judged are not a result that repeats, so their fold says "recorded, not judged" and
 * gives no count of judged steps. Where a file gives no count for a scenario, none is shown.
 */
export function foldLabel(folded: readonly ScenarioResult[]): string {
  const more = plural(folded.length, 'more scenario');
  if (folded.every(isUnjudged)) return `${more} recorded, not judged`;
  const counts = folded.map(({ judgedSteps }) => judgedSteps);
  if (!counts.every((count) => count !== undefined)) return `${more}, same result`;
  const judged = counts.reduce((sum, count) => sum + count, 0);
  return `${more}, same result, ${plural(judged, 'step')} judged`;
}

/**
 * What a folded scenario says beside its name: only what sets it apart from the others of its
 * fold, which is how many steps were judged and how many were not. Its own reason in full when
 * the file gives no count; the number of steps it recorded when none of them was judged.
 */
export function foldRowWords(result: ScenarioResult): string {
  const { judgedSteps, recordedSteps, reason } = result;
  if (judgedSteps === undefined) return reason;
  if (judgedSteps === 0) {
    return recordedSteps === undefined ? 'not judged' : `${plural(recordedSteps, 'step')} recorded`;
  }
  const notJudged = notJudgedSteps(result) ?? 0;
  const judged = `${plural(judgedSteps, 'step')} judged`;
  return notJudged > 0 ? `${judged}, ${notJudged} not judged` : judged;
}
