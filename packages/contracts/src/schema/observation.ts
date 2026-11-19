import { z } from 'zod';
import { NonEmpty, RuleId, Slug } from './primitives.ts';

// What the engine records while it drives a component: one Step per user action.

const AccessibleRef = z.strictObject({ role: z.string().nullable(), name: z.string() });

export const AccessibleStates = z.strictObject({
  expanded: z.boolean().optional(),
  selected: z.boolean().optional(),
  checked: z.union([z.boolean(), z.literal('mixed')]).optional(),
  disabled: z.boolean().optional(),
  invalid: z.boolean().optional(),
  /**
   * The kind of popup the focused element says it has, when that is more than its role already
   * says: read from its own `aria-haspopup` attribute ("true" is a menu) and left out when the
   * value is the role's default. A combobox has a listbox by default, so writing
   * aria-haspopup="listbox" on it records nothing (ADR 0003, amendments of 2026-11-16).
   */
  hasPopup: z.enum(['menu', 'listbox', 'tree', 'grid', 'dialog']).optional(),
});
export type AccessibleStates = z.infer<typeof AccessibleStates>;

/** An element as the browser's accessibility tree exposes it. */
export const AccessibleNode = z.strictObject({
  role: z.string().nullable(),
  name: z.string(),
  description: z.string().optional(),
  /** From aria-posinset/aria-setsize, or derived from siblings (ADR 0003, "Position in set"). */
  posInSet: z.int().positive().optional(),
  setSize: z.int().positive().optional(),
  states: AccessibleStates,
});
export type AccessibleNode = z.infer<typeof AccessibleNode>;

export const FocusInfo = z.strictObject({
  ...AccessibleNode.shape,
  /** Focus fell to document.body: almost always a defect worth showing. */
  isBody: z.boolean(),
  isInsideComponent: z.boolean(),
  /**
   * Focus is on, or inside, the index-th of count items the adapter locates (DOM order). Kept
   * apart from posInSet, which is what the accessibility tree exposes to assistive technology.
   */
  item: z.strictObject({ index: z.int().positive(), count: z.int().positive() }).optional(),
  /**
   * For adapters that declare a popup: focus is on the popup or inside it. A menu is often
   * rendered at the end of the page, outside the component root, so `isInsideComponent` alone
   * would read a focused menu item as focus that left the component (ADR 0003, 2026-11-16).
   */
  isInsidePopup: z.boolean().optional(),
  /** Resolved aria-activedescendant, for patterns that move virtual focus. */
  activeDescendant: AccessibleNode.optional(),
  /**
   * aria-activedescendant is set but names no element in the accessibility tree, so assistive
   * technology is pointed at nothing. Absent when it resolves or is not set.
   */
  activeDescendantUnresolved: z.literal(true).optional(),
  /** The text in the focused text field. Absent for other elements, and never read from a password field. */
  value: z.string().optional(),
  /** Debugging aid only, never shown in the UI. */
  path: z.string().optional(),
  /**
   * A number the engine gives an element the first time it holds focus in a run; the same number
   * means the same element. Whether focus moved is read from this and never from `path`, which
   * changes when a sibling is added or removed while the element stays where it is (ADR 0003,
   * amendment of 2026-11-16, engine 0.16.1).
   */
  element: z.int().positive().optional(),
});
export type FocusInfo = z.infer<typeof FocusInfo>;

/** How long the page took to settle after an action, and whether it went quiet before the cap. */
export const Settle = z.strictObject({ ms: z.number().nonnegative(), quiet: z.boolean() });
export type Settle = z.infer<typeof Settle>;

export const Announcement = z.strictObject({
  text: NonEmpty,
  politeness: z.enum(['polite', 'assertive']),
  /** Milliseconds after the step's action started. */
  at: z.number().nonnegative(),
  /** The region was added after page load; screen readers often miss these. */
  insertedLate: z.boolean(),
});
export type Announcement = z.infer<typeof Announcement>;

/**
 * A live region that entered the page already holding this text. Kept apart from announcements:
 * screen readers often do not speak a region that arrives together with its text (ADR 0003).
 */
export const InsertedRegion = z.strictObject({
  text: NonEmpty,
  politeness: z.enum(['polite', 'assertive']),
});
export type InsertedRegion = z.infer<typeof InsertedRegion>;

const AxValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const AxDiff = z.strictObject({
  added: z.array(AccessibleRef),
  removed: z.array(AccessibleRef),
  changed: z.array(
    z.strictObject({ node: AccessibleRef, property: NonEmpty, before: AxValue, after: AxValue }),
  ),
});
export type AxDiff = z.infer<typeof AxDiff>;

/** The pattern's popup at one moment, as the accessibility tree exposes it. */
export const PopupState = z.strictObject({
  /** The popup element is in the accessibility tree. */
  present: z.boolean(),
  /** Its options in DOM order, wherever on the page the popup is rendered. */
  options: z.array(AccessibleNode),
  /**
   * The element that opens the popup, as the tree exposes it, for adapters that say where it is
   * (a menu button). Its expanded state is read here: once focus is in the menu, the focused
   * element says nothing about the button. Absent when the tree leaves it out.
   */
  opener: AccessibleNode.optional(),
});
export type PopupState = z.infer<typeof PopupState>;

export const Action = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('press'), key: NonEmpty }),
  z.strictObject({ type: z.literal('type'), text: z.string() }),
  z.strictObject({ type: z.literal('click'), target: AccessibleRef }),
]);
export type Action = z.infer<typeof Action>;

export const Step = z.strictObject({
  action: Action,
  focusBefore: FocusInfo,
  focusAfter: FocusInfo,
  announcements: z.array(Announcement),
  /** Present only when a live region entered the page with text during the step. */
  insertedRegions: z.array(InsertedRegion).min(1).optional(),
  axDiff: AxDiff,
  settle: Settle,
  /**
   * For patterns with a popup (ADR 0003, amendment of 2026-11-14): its state before and after the
   * action. Systems often render it outside the component root, where `axDiff` does not look.
   */
  popup: z.strictObject({ before: PopupState, after: PopupState }).optional(),
  /**
   * For adapters that declare where the page shows what an action did (ADR 0003, 2026-11-16):
   * that element's text before and after the step, empty when it is not on the page. A measured
   * page writes "Last action: <item>" there from the item's own handler, so the engine can tell
   * an item that was activated from a menu that merely closed.
   */
  effect: z.strictObject({ before: z.string(), after: z.string() }).optional(),
  /** Semantic model lines, not real screen reader output (packages/engine/CLAUDE.md, Capture). */
  speech: z.array(NonEmpty),
});
export type Step = z.infer<typeof Step>;

export const Run = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('completed'), steps: z.array(Step).min(1) }),
  z.strictObject({ status: z.literal('setup-failed'), reason: NonEmpty }),
  z.strictObject({ status: z.literal('errored'), reason: NonEmpty, steps: z.array(Step) }),
]);
export type Run = z.infer<typeof Run>;

export const Scenario = z.strictObject({
  id: Slug,
  rules: z.array(RuleId).min(1),
  initialState: NonEmpty,
  /** Every run is kept, so disagreement between runs stays visible. */
  runs: z.array(Run).min(1),
});
export type Scenario = z.infer<typeof Scenario>;

export const Verdict = z.enum(['follows', 'differs', 'inconclusive', 'not-applicable']);
export type Verdict = z.infer<typeof Verdict>;

export const VerdictResult = z.strictObject({
  verdict: Verdict,
  /**
   * A short factual phrase for the comparison matrix ("First Backspace removes a chip"), written
   * by the evaluator so no hand-made summary sits next to measured data. 60 characters fit a cell.
   */
  summary: NonEmpty.max(60),
  /** The full factual reason, quoting what was recorded. */
  reason: NonEmpty,
  /**
   * On one scenario's result, where the evaluator judges several steps: how many it judged. The
   * same number its reason states, as data, so nothing has to read it out of the sentence
   * (engine 0.16.1). Absent where a rule is judged on one step or the count means nothing.
   */
  judgedSteps: z.int().nonnegative().optional(),
  /**
   * For a rule: each covering scenario's own result, in suite order, so a reader can see which
   * recording decided the verdict and which could not judge it (ADR 0004, amended 2026-11-11).
   * Absent on a single scenario's result and on files measured before engine 0.9.0.
   */
  basis: z
    .array(
      z.strictObject({
        scenario: Slug,
        verdict: Verdict,
        summary: NonEmpty.max(60),
        /** The scenario's own `judgedSteps`, when its evaluator gave one. */
        judgedSteps: z.int().nonnegative().optional(),
      }),
    )
    .optional(),
});
export type VerdictResult = z.infer<typeof VerdictResult>;
