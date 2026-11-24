import { z } from 'zod';
import { NonEmpty, PatternId, RuleId, Slug, addIssue, reportDuplicates } from './primitives.ts';
import { Source, Sources } from './sources.ts';

// Hand-written pattern content: rules, design requirements, trade-offs.

export const Rule = z.strictObject({
  id: RuleId,
  title: NonEmpty,
  description: NonEmpty,
  /** Key names as Playwright spells them, combined with "+", for example "Shift+Tab". */
  keys: z.array(NonEmpty).min(1),
  /**
   * `rule`: what a cited WCAG criterion or APG practice asks, in Earshot's words (a WCAG criterion
   * cited only as related is marked so, with a note that says why). `recommendation`: advice Earshot adds beyond them;
   * its description says why, and the site labels it as ours. Decided 2026-11-09.
   */
  level: z.enum(['rule', 'recommendation']),
  sources: Sources,
});
export type Rule = z.infer<typeof Rule>;

export const Requirement = z.strictObject({
  id: Slug,
  title: NonEmpty,
  reason: NonEmpty,
  /** `wcag` is required for conformance; `guidance` is advice we stand behind but WCAG does not mandate. */
  level: z.enum(['wcag', 'guidance']),
  sources: Sources,
});
export type Requirement = z.infer<typeof Requirement>;

/** Published only after the owner's review (`status: 'reviewed'`). */
const ReviewStatus = z.enum(['draft', 'reviewed']);

export const TradeOff = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('alternative'),
    ruleId: RuleId,
    /** Adapter ids of measured systems that take this alternative; their difference is told here. */
    seenIn: z.array(Slug).optional(),
    alternative: NonEmpty,
    gain: NonEmpty,
    cost: NonEmpty,
    reasonableWhen: NonEmpty,
    status: ReviewStatus,
  }),
  z.strictObject({ kind: z.literal('none'), ruleId: RuleId, note: NonEmpty, status: ReviewStatus }),
  /**
   * A different model of the whole pattern that a measured system chose on purpose. One design
   * decision explains its verdicts on several rules, so it is written once and shown on each.
   * A difference is a model only when, besides the recording, its mechanism is on record (in the
   * system's documentation, in its source, or seen by hand with a date) and has an effect a
   * person can perceive: on screen, in the accessibility tree or in an announcement (ADR 0009,
   * 2026-11-15). `basis` says which.
   */
  z.strictObject({
    kind: z.literal('model'),
    ruleIds: z.array(RuleId).min(1),
    /** Adapter ids of the measured systems that use this model. */
    seenIn: z.array(Slug).min(1),
    model: NonEmpty,
    howItWorks: NonEmpty,
    gain: NonEmpty,
    cost: NonEmpty,
    reasonableWhen: NonEmpty,
    /** What the text rests on beyond the measurement, for example a check by hand. */
    basis: NonEmpty,
    status: ReviewStatus,
  }),
]);
export type TradeOff = z.infer<typeof TradeOff>;

const ApgRelation = z.discriminatedUnion('dedicated', [
  z.strictObject({ dedicated: z.literal(true), pattern: Source }),
  z.strictObject({ dedicated: z.literal(false), note: NonEmpty, builtOn: Sources }),
]);

const PatternShape = z.strictObject({
  id: PatternId,
  name: NonEmpty,
  aliases: z.array(NonEmpty),
  description: NonEmpty,
  apg: ApgRelation,
  rules: z.array(Rule).min(1),
  requirements: z.array(Requirement),
  tradeOffs: z.array(TradeOff),
});

export const Pattern = PatternShape.superRefine((pattern, ctx) => {
  reportDuplicates(ctx, pattern.rules, { listPath: 'rules', field: 'id', keyOf: (r) => r.id });
  reportDuplicates(ctx, pattern.requirements, {
    listPath: 'requirements',
    field: 'id',
    keyOf: (r) => r.id,
  });

  const ruleIds = new Set(pattern.rules.map((r) => r.id));
  pattern.tradeOffs.forEach((tradeOff, i) => {
    const ids = tradeOff.kind === 'model' ? tradeOff.ruleIds : [tradeOff.ruleId];
    for (const id of ids.filter((ruleId) => !ruleIds.has(ruleId))) {
      addIssue(ctx, ['tradeOffs', i, 'ruleId'], `Unknown rule "${id}"`);
    }
  });
});
export type Pattern = z.infer<typeof Pattern>;
