import type { Pattern, Scenario, TradeOff } from '@earshot/contracts';

export type RuleTradeOff = Exclude<TradeOff, { kind: 'model' }>;
export type ModelTradeOff = Extract<TradeOff, { kind: 'model' }>;

/** The hand-written alternatives (or "none") for one rule, in the order they are written. */
export const ruleTradeOffs = (pattern: Pattern, ruleId: string): RuleTradeOff[] =>
  pattern.tradeOffs.filter(
    (entry): entry is RuleTradeOff => entry.kind !== 'model' && entry.ruleId === ruleId,
  );

/**
 * Places each measured difference under the alternative it is: one that names the system in
 * `seenIn`, else the rule's alternative that names no systems. A difference no alternative
 * describes is returned in `rest`, so it is never filed under a behavior it does not have
 * (verdict audit 2026-11-09: Fluent's one group stop was listed under "a stop on every button").
 */
export function assignDifferences<D extends { adapter: string }>(
  tradeOffs: readonly RuleTradeOff[],
  differences: readonly D[],
): { byTradeOff: D[][]; rest: D[] } {
  const named = (entry: RuleTradeOff) => (entry.kind === 'alternative' ? entry.seenIn : undefined);
  const claimed = new Set(tradeOffs.flatMap((entry) => named(entry) ?? []));
  const catchAll = tradeOffs.findIndex(
    (entry) => entry.kind === 'alternative' && named(entry) === undefined,
  );
  const unclaimed = differences.filter(({ adapter }) => !claimed.has(adapter));
  const byTradeOff = tradeOffs.map((entry, index) => {
    const systems = named(entry);
    if (systems) return differences.filter(({ adapter }) => systems.includes(adapter));
    return index === catchAll ? unclaimed : [];
  });
  return { byTradeOff, rest: catchAll === -1 ? unclaimed : [] };
}

/**
 * A model explains a verdict that is not "follows": a difference, or a rule that could not be
 * judged because of the design. Where a system named by a model follows the rule, there is
 * nothing to explain, and saying "a different model" there would read as a difference that is
 * not one (verdict audit 2026-11-16: MUI's modal menu follows the Tab rule).
 */
export const isExplainedByModel = (verdict: string): boolean =>
  verdict === 'differs' || verdict === 'inconclusive';

interface ModelQuery {
  ruleId: string;
  /** With `verdict`: only the models that explain this system's verdict on the rule. */
  adapter?: string;
  verdict?: string;
}

/** Models of the whole pattern that explain a rule's verdicts, optionally for one system. */
export function modelsFor(
  pattern: Pattern,
  { ruleId, adapter, verdict }: ModelQuery,
): ModelTradeOff[] {
  if (verdict !== undefined && !isExplainedByModel(verdict)) return [];
  return pattern.tradeOffs.filter(
    (entry): entry is ModelTradeOff =>
      entry.kind === 'model' &&
      entry.ruleIds.includes(ruleId) &&
      (adapter === undefined || entry.seenIn.includes(adapter)),
  );
}

/**
 * A chip the adapter located held focus, but the accessibility tree gave it no set position:
 * the behavior may follow the rule while a screen reader does not hear "2 of 3" (ADR 0007).
 */
export const hasUnpositionedChip = (scenarios: readonly Scenario[]): boolean =>
  scenarios.some(({ runs }) =>
    runs.some(
      (run) =>
        run.status === 'completed' &&
        run.steps.some(({ focusAfter }) => focusAfter.item && focusAfter.posInSet === undefined),
    ),
  );

/**
 * Where a model's note sits in one rule's evidence. It starts with "ev-<rule>-", so a link to it
 * opens that rule's Evidence disclosure and moves focus there, like a link to a card.
 */
export const modelNoteId = (ruleId: string, model: ModelTradeOff): string =>
  `ev-${ruleId}-model-${model.seenIn.join('-')}`;

/** What the count needs from each counted verdict: the adapter a model names, and the system. */
interface CountedVerdict {
  adapter: string;
  system: string;
  verdict: string;
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** "A", "A and B", "A, B and C". */
const listed = (names: readonly string[]): string =>
  names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

/**
 * Said next to a rule's count when a model explains a counted difference: one deliberate design
 * differing on several rules should not read as several separate faults (verdict audit
 * 2026-11-11, M1). The verdicts stay, because each key does behave differently.
 */
export function modelCountNote(
  models: readonly ModelTradeOff[],
  verdicts: readonly CountedVerdict[],
): string | undefined {
  // A reviewed model is said as a count of its own (modelShares); the sentence is for drafts.
  const notes = models.flatMap((model) => {
    if (model.status === 'reviewed') return [];
    const systems = verdicts
      .filter((v) => v.verdict === 'differs' && model.seenIn.includes(v.adapter))
      .map((v) => v.system);
    if (systems.length === 0) return [];
    const isOne = systems.length === 1;
    const design = `${listed(systems)} ${isOne ? 'differs' : 'differ'} here by one design, ${lowerFirst(model.model)}`;
    // A model that covers one rule explains nothing "together": the design is named and that is all.
    if (model.ruleIds.length < 2) return [`${design}.`];
    return [
      `${design}, which explains ${isOne ? 'its' : 'their'} differences on ${model.ruleIds.length} rules together.`,
    ];
  });
  return notes.length > 0 ? notes.join(' ') : undefined;
}

/** How many of a rule's judged systems share one reviewed model, and where its card is. */
export interface ModelShare {
  count: number;
  /** The model's card in this rule's evidence. */
  href: string;
}

/**
 * A second count beside "1 of 5 follow", for every rule a reviewed model covers: how many of
 * the judged systems are named by that model. One design shared by most systems is then read as
 * that, not as most systems failing (design review 2026-11-14). Draft models are not counted:
 * a count is a statement, and an unreviewed text is not yet one.
 */
export function modelShares(
  ruleId: string,
  models: readonly ModelTradeOff[],
  verdicts: readonly CountedVerdict[],
): ModelShare[] {
  return models.flatMap((model) => {
    if (model.status !== 'reviewed') return [];
    // Only the systems whose difference the model explains: one it names that follows the rule
    // is not part of "share one other model" here.
    const count = verdicts.filter(
      (v) => v.verdict === 'differs' && model.seenIn.includes(v.adapter),
    ).length;
    return count > 0 ? [{ count, href: `#${modelNoteId(ruleId, model)}` }] : [];
  });
}
