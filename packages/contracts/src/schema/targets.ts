import { z } from 'zod';
import { NonEmpty, PatternId, RuleId, Slug } from './primitives.ts';

// data/targets.yaml: every candidate system per pattern and why it is or is not measured
// (packages/engine/CLAUDE.md, Adapters and Targets). Field names follow the YAML file.

const shared = {
  system: NonEmpty,
  component: NonEmpty.optional(),
  docs: z.url().optional(),
  /** Date the URLs were opened; never added from memory. */
  checked: z.iso.date().optional(),
  /**
   * Our working notes: dependency quirks, measurement history, why something is not approved.
   * Internal. The site never shows them; what a reader should see goes in `setup` and
   * `observations` below.
   */
  notes: z.array(NonEmpty).optional(),
};

export const Observation = z
  .strictObject({
    text: NonEmpty,
    /**
     * `script`: keys pressed and the page watched by a script of ours, outside the engine.
     * `screenshots`: the measured page captured before and after each key, and compared by eye.
     * The method belongs here, in the label the site prints, not in the note's text.
     */
    source: z.enum(['recorded', 'seen', 'screenshots', 'script', 'package-source', 'docs']),
    date: z.iso.date(),
    /**
     * For `recorded` only: the adapter whose measurement file the note was read from. Left out, it
     * is the system's own measurement; named, it is a variant of the system (`variant-of`). Either
     * way the file must exist and be dated like the note, which data validation checks: every
     * "Recorded by the engine" on the site leads to a file a reader can open (ADR 0005, amendment
     * of 2026-11-16).
     */
    measurement: Slug.optional(),
    /**
     * The rules the note concerns: the site shows it under those rules only. Left out, the note
     * is about the component whatever the rule, and is shown under each of them. Every id must be
     * a rule of the pattern, which data validation checks.
     */
    rules: z.array(RuleId).min(1).optional(),
  })
  .refine(({ source, measurement }) => source === 'recorded' || measurement === undefined, {
    message: 'Only a recorded observation names a measurement.',
    path: ['measurement'],
  });
export type Observation = z.infer<typeof Observation>;

const demo = {
  /** A public URL, or a description of the local page for the reference. */
  url: NonEmpty,
  found: NonEmpty.optional(),
  'version-source': NonEmpty.optional(),
  robots: NonEmpty.optional(),
  /** The owner's own deprecation notice; the Earshot card must link it. */
  deprecated: z.url().optional(),
  /**
   * Present when the measurement is shown but kept out of agreement counts for a reason other
   * than deprecation: the reason, as the words after "Not counted:" (lower case, no full stop).
   * Used when the maintainers ship a dedicated component that Earshot cannot measure yet, so the
   * verdicts describe a second way to build the pattern (packages/engine/CLAUDE.md, Targets).
   */
  'not-counted': NonEmpty.optional(),
  /** The system's own docs demo, kept for context when we measure a harness page (ADR 0005). */
  'docs-example': z.url().optional(),
  /**
   * Present when the maintainers document this pattern as a composition of several of their
   * published components, not as one component (ADR 0006): what it combines and what Earshot did
   * to assemble it. Shown next to every verdict for the system.
   */
  composition: NonEmpty.optional(),
  /**
   * How the measured page was built, in one or two plain sentences: which example it follows and
   * what Earshot set. For a reader who wants to repeat the measurement. Shown on the site.
   */
  setup: NonEmpty.optional(),
  /**
   * Present when the system's docs show more than one way to build this pattern and the measured
   * one is not the only reasonable choice: which was measured and which was not, in one or two
   * plain sentences. A fact about our page, not about the component. Shown next to every verdict
   * for the system, so a maintainer sees at once what the verdicts cover.
   */
  variant: NonEmpty.optional(),
  /**
   * Behavior of the component a reader should know on every rule. Each note has one source and
   * its date, and the site prints both beside it: what the engine recorded, what was seen by
   * hand on the measured page, and what was read in the package's source or the system's docs
   * are never mixed under one label (CLAUDE.md 2.1; the owner, 2026-11-15). A fact with two sources
   * is two notes. For `recorded` the date is the measurement it was read from: check the note
   * again when the system is measured again. Never a verdict, and never a repeat of one.
   */
  observations: z.array(Observation).optional(),
  /**
   * Present when what was recorded depends on the operating system the measurement ran on: what
   * differs, in one or two plain sentences, and how that is known (read in the package's source,
   * or measured on another system). Shown next to every verdict for the system.
   */
  platform: NonEmpty.optional(),
};

export const TargetEntry = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('measured'),
    adapter: Slug,
    /**
     * Present when this measurement is another way to build the pattern in a system that is
     * already measured: the adapter of that system's counted entry. A variant is never a column
     * and never counted; it is shown as evidence with the system it belongs to, beside the note
     * that cites it, with its own provenance. It must say why in `not-counted`.
     */
    'variant-of': Slug.optional(),
    ...shared,
    ...demo,
  }),
  z.strictObject({ status: z.literal('planned'), ...shared, ...demo }),
  z.strictObject({
    status: z.literal('not-applicable'),
    reason: NonEmpty,
    /** Where the system's own docs show there is no equivalent component. */
    evidence: z.union([z.url(), z.array(z.url()).min(1)]),
    ...shared,
  }),
]);
export type TargetEntry = z.infer<typeof TargetEntry>;

export const Targets = z.record(PatternId, z.array(TargetEntry));
export type Targets = z.infer<typeof Targets>;

export type MeasuredEntry = Extract<TargetEntry, { status: 'measured' }>;

/** The measured entries that are variants of another system's entry, not systems of their own. */
export const variantEntries = (entries: readonly TargetEntry[]): MeasuredEntry[] =>
  entries.filter(
    (entry): entry is MeasuredEntry =>
      entry.status === 'measured' && entry['variant-of'] !== undefined,
  );

/** The adapter whose measurement file a recorded observation was read from. */
export const measurementOf = (entry: MeasuredEntry, observation: Observation): string =>
  observation.measurement ?? entry.adapter;
