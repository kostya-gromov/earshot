import type { Action, Step } from '@earshot/contracts';

/*
 * One rule for every pattern (decided by the owner 2026-11-15, ADR 0003): the text a live region
 * holds counts as the announcement of a change only if it names that change and does not appear
 * in the same form in a step without it. Text written into a region and a region that enters the
 * page already holding text are read the same way; the reason says which it was.
 */

export interface RecordedScenario {
  scenarioId: string;
  steps: readonly Step[];
}

export interface LiveText {
  text: string;
  /** Written into a region that was there, into one that arrived in this step, or arrived with it. */
  arrival: 'written' | 'written-late' | 'inserted';
}

interface Occurrence {
  scenarioId: string;
  action: Action;
}

/** Every text a live region held in a step, in the order the engine recorded it. */
export function liveTexts({ announcements, insertedRegions }: Step): LiveText[] {
  const written = announcements.map(({ text, insertedLate }): LiveText => {
    return { text, arrival: insertedLate ? 'written-late' : 'written' };
  });
  // A region that arrives and is then written to is recorded both ways; it is one text.
  const arrived = (insertedRegions ?? []).filter(
    ({ text }) => !written.some((candidate) => candidate.text === text),
  );
  return [...written, ...arrived.map(({ text }): LiveText => ({ text, arrival: 'inserted' }))];
}

/** Where each live text was first held in a step without the change, across the recording. */
export function textsSeenWithout(
  recorded: readonly RecordedScenario[],
  hasChange: (step: Step) => boolean,
): ReadonlyMap<string, Occurrence> {
  const held = recorded.flatMap(({ scenarioId, steps }) =>
    steps
      .filter((step) => !hasChange(step))
      .flatMap((step) => liveTexts(step).map(({ text }) => ({ text, scenarioId, step }))),
  );
  const seen = new Map<string, Occurrence>();
  for (const { text, scenarioId, step } of held) {
    if (!seen.has(text)) seen.set(text, { scenarioId, action: step.action });
  }
  return seen;
}

const quoted = (texts: readonly LiveText[]) => texts.map(({ text }) => `"${text}"`).join(', ');

/**
 * The texts as a reason quotes them. A region that was not on the page before the step is said
 * to be so: screen readers often miss those, and a verdict should show what it rests on.
 */
export function saidTexts(texts: readonly LiveText[]): string {
  const has = (arrival: LiveText['arrival']) => texts.some((text) => text.arrival === arrival);
  const late = has('written-late') ? ' (in a region that entered the page during this step)' : '';
  const inserted = has('inserted')
    ? ' (in a region that entered the page already holding its text)'
    : '';
  return quoted(texts) + late + inserted;
}

function describeAction(action: Action): string {
  if (action.type === 'press') return action.key;
  return action.type === 'type' ? `typing "${action.text}"` : `a click on "${action.target.name}"`;
}

const heldAs: Readonly<Record<LiveText['arrival'], string>> = {
  written: 'A live region said',
  'written-late': 'A live region that entered the page during this step said',
  inserted: 'A live region entered the page in this step already holding',
};

export interface ChangeQuestion {
  step: Step;
  /** Whether a text names the change; undefined when the recording does not show what changed. */
  names: (text: string) => boolean | undefined;
  seenWithout: ReadonlyMap<string, Occurrence>;
  /** The reason's words for the change and for what names it: "removal", "the removed value". */
  change: { noun: string; named: string };
}

export type ChangeAnnouncement =
  | { kind: 'announced'; texts: readonly LiveText[] }
  | { kind: 'silent' }
  | { kind: 'not-counted'; reason: string }
  | { kind: 'undetermined'; reason: string };

/** Why one text is not the announcement of the change; undefined when nothing rules it out. */
function ruledOut(text: LiveText, question: ChangeQuestion): string | undefined {
  const { noun, named } = question.change;
  const elsewhere = question.seenWithout.get(text.text);
  const repeated = elsewhere
    ? `the same text appeared after ${describeAction(elsewhere.action)} in [${elsewhere.scenarioId}], with no ${noun}`
    : undefined;
  // Repetition is enough by itself and is plain in the recording, so it is the only ground given
  // when it holds. Whether a text that lists every value "names" the one removed is arguable
  // (verdict audit 2026-11-15: names run together), and a reason should not rest on that.
  if (repeated) return `${repeated.charAt(0).toUpperCase()}${repeated.slice(1)}.`;
  return question.names(text.text) === false ? `It does not name ${named}.` : undefined;
}

export function judgeChangeAnnouncement(question: ChangeQuestion): ChangeAnnouncement {
  const texts = liveTexts(question.step);
  if (texts.length === 0) return { kind: 'silent' };
  const { noun, named } = question.change;
  const reasons = texts.map((text) => ruledOut(text, question));
  const open = texts.filter((_, index) => reasons[index] === undefined);
  const announced = open.filter(({ text }) => question.names(text) === true);
  if (announced.length > 0) return { kind: 'announced', texts: announced };
  if (open.length > 0) {
    return {
      kind: 'undetermined',
      reason: `A live region held ${saidTexts(open)}, and the recording does not show ${named}, so the engine cannot tell whether that announces the ${noun}.`,
    };
  }
  const told = texts.map(
    (text, index) => `${heldAs[text.arrival]} "${text.text}". ${reasons[index]}`,
  );
  return {
    kind: 'not-counted',
    reason: `${told.join(' ')} So it is not counted as an announcement of the ${noun}.`,
  };
}
