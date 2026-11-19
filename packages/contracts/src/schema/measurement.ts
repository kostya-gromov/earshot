import { z } from 'zod';
import { NonEmpty, PatternId, RuleId, Slug, addIssue } from './primitives.ts';
import { Scenario, VerdictResult } from './observation.ts';

/** A version is either read from something verifiable, or "unknown" with the reason. Never guessed. */
export const SystemVersion = z.union(
  [
    z.strictObject({
      version: NonEmpty.refine((v) => v !== 'unknown', 'Use the unknown variant with a reason'),
      source: NonEmpty,
    }),
    z.strictObject({ version: z.literal('unknown'), reason: NonEmpty }),
  ],
  { error: 'Give { version, source } read from the target, or { version: "unknown", reason }' },
);
export type SystemVersion = z.infer<typeof SystemVersion>;

/**
 * Where the measured page lives: a public URL, or for pages served locally (the reference and
 * the harness, ADR 0005) the page's path in this repository, since a local port means nothing.
 */
const MeasuredPage = z.union([
  z.url(),
  z.string().regex(/^packages\/[\w./-]+$/, 'A repository path under packages/'),
]);

export const Target = z.strictObject({
  system: NonEmpty,
  systemVersion: SystemVersion,
  url: MeasuredPage,
  adapter: Slug,
  adapterVersion: z.int().positive(),
  /** How the adapter finds the pattern's items (chips), shown on the evidence card. */
  itemsFoundBy: NonEmpty.optional(),
});
export type Target = z.infer<typeof Target>;

/**
 * `measured` can only be produced by the engine and carries full provenance.
 * `illustrative` is never produced by the engine and never counts toward agreement.
 */
export const Provenance = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('measured'),
    engineVersion: z.string().regex(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/, 'Semver, for example 0.1.0'),
    browser: NonEmpty,
    os: NonEmpty,
    measuredAt: z.iso.datetime(),
    runs: z.int().positive(),
    consistent: z.boolean(),
  }),
  z.strictObject({ status: z.literal('illustrative'), note: NonEmpty }),
]);
export type Provenance = z.infer<typeof Provenance>;

const MeasurementShape = z.strictObject({
  schemaVersion: z.literal(1),
  pattern: PatternId,
  target: Target,
  provenance: Provenance,
  scenarios: z.array(Scenario),
  verdicts: z.record(RuleId, VerdictResult),
  artifacts: z.strictObject({ trace: NonEmpty.optional() }).optional(),
});
type MeasurementShape = z.infer<typeof MeasurementShape>;
type MeasuredProvenance = Extract<Provenance, { status: 'measured' }>;
type Ctx = z.core.$RefinementCtx;

function checkRunsKept(m: MeasurementShape, { runs }: MeasuredProvenance, ctx: Ctx) {
  if (m.scenarios.length === 0) addIssue(ctx, ['scenarios'], 'A measured record needs scenarios');
  m.scenarios.forEach((scenario, i) => {
    if (scenario.runs.length === runs) return;
    const message = `Expected ${runs} runs (provenance.runs), found ${scenario.runs.length}`;
    addIssue(ctx, ['scenarios', i, 'runs'], message);
  });
}

function checkVerdictsCovered(m: MeasurementShape, ctx: Ctx) {
  const covered = new Set(m.scenarios.flatMap((s) => s.rules));
  for (const ruleId of Object.keys(m.verdicts)) {
    if (!covered.has(ruleId)) {
      addIssue(ctx, ['verdicts', ruleId], `No scenario exercises rule "${ruleId}"`);
    }
  }
}

// Disagreeing runs must surface as inconclusive, never as a silently picked majority.
function checkFlakinessVisible(m: MeasurementShape, { consistent }: MeasuredProvenance, ctx: Ctx) {
  const anyInconclusive = Object.values(m.verdicts).some((v) => v.verdict === 'inconclusive');
  if (!consistent && !anyInconclusive) {
    const message = 'Inconsistent runs must leave at least one verdict inconclusive';
    addIssue(ctx, ['provenance', 'consistent'], message);
  }
}

export const Measurement = MeasurementShape.superRefine((m, ctx) => {
  if (m.provenance.status !== 'measured') return;
  checkRunsKept(m, m.provenance, ctx);
  checkVerdictsCovered(m, ctx);
  checkFlakinessVisible(m, m.provenance, ctx);
});
export type Measurement = z.infer<typeof Measurement>;
