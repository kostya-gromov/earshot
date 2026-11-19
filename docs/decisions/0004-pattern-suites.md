# 0004. Pattern suites keep the runner independent of a specific pattern

- Status: accepted (2026-11-01)
- Scope: M1 runner and evaluators; adapter sharing revisited in M2

## Context

The capture layer is already pattern-independent: it records focus, active descendants, live-region
announcements, accessibility-tree changes and settling after an action. The current orchestration is
not. `Adapter` defaults its state type to `ChipsState`, and the debug command hard-codes the reference
adapter, three chip names and an ad-hoc key sequence.

The next patterns need the same capture and runner but different content, scenario definitions,
initial states and evaluators. We need a seam where a pattern supplies those differences without
turning the engine into a framework designed from one example.

Two similarly named concepts must stay separate:

- A **scenario definition** is engine input: typed setup intent plus actions to perform.
- A contracts **Scenario** is measurement output: runs and recorded observations.

## Options

1. **Pattern suites now, with deliberately small interfaces.** Register each pattern's metadata,
   scenario definitions, evaluators and target factories together. Keep capture and the runner
   generic.
2. **Generalise every repeated-looking operation now.** Add a suite registry, an evaluator assertion
   DSL, shared reference widgets and system-level adapter bases before the second pattern.
3. **Keep the runner specific to input-with-chips until M4.** Extract boundaries only when combobox is
   implemented.

Option 2 risks encoding chip-specific assumptions in APIs that look generic. Option 3 lets those
assumptions spread through the runner and CLI, making the later extraction larger and harder to
review.

## Decision

Choose option 1. Add a small engine-only pattern suite boundary in M1.

### Scenario definitions

Each scenario owns its typed setup intent. A suite does not have one global initial state because
later patterns may need different setup states for different scenarios.

```ts
interface ScenarioDefinition<State, InteractionId extends string> {
  id: string;
  rules: readonly string[];
  requestedStateDescription: string;
  initialState: State;
  steps: readonly StepDefinition<InteractionId>[];
}
```

`id`, `rules` and `requestedStateDescription` use the types inferred from the contracts `Slug`,
`RuleId` and `NonEmpty` schemas in the implementation. `requestedStateDescription` is setup and
debugging input only; it is never published as an observed state.

A step definition is distinct from the concrete contracts `Action` stored in a measurement:

```ts
type StepDefinition<InteractionId extends string> =
  | { type: 'press'; key: string }
  | { type: 'type'; text: string }
  | { type: 'click'; target: InteractionId };
```

Keyboard and text steps are performed directly. A click uses a pattern-owned semantic interaction
id, such as `second-remove-control`, rather than a reference-only accessible name. The adapter
resolves that id to a locator for its target. Immediately before clicking, the runner records the
locator's actual role and accessible name as the concrete `Action.target` in the measurement.

State describes target-independent intent, not a target's literal fixture values. For example, the
chips suite asks for three selected items and an empty focused input. Each adapter reaches the
closest equivalent state using the target like a user. Evaluators judge recorded roles, focus,
counts and announcements rather than requiring the same names in every system.

### Evaluator unit and aggregation

One evaluator remains responsible for one rule, but it evaluates **one completed run of one
scenario** at a time:

```ts
interface EvaluatorInput {
  scenarioId: string;
  steps: readonly Step[];
}

type Evaluator = (input: EvaluatorInput) => VerdictResult;
```

The input types are inferred from contracts schemas in code. The evaluator is pure and has no access
to Playwright, adapters, the clock or the file system. A rule evaluator may handle more than one
scenario id; for example, `tab` evaluates both `tab-out` and `tab-from-chip`.

The runner aggregates results in two stages:

1. **Runs of one scenario.** Any setup failure or errored run makes the scenario's affected rules
   `inconclusive`, even when the remaining completed runs agree. Completed runs are evaluated
   separately. If their verdicts or normalized observations disagree, the scenario result is
   `inconclusive` with reason `flaky`; no majority is selected.
2. **Scenarios covering one rule** (amended 2026-11-07, see below). A scenario whose runs were
   unreliable (setup failed, errored, flaky, disagreeing initial states) makes the final rule
   `inconclusive`. Otherwise any `differs` result makes the rule `differs`, and scenarios that
   could not judge the rule are listed in its reason as "Not judged". Otherwise any `follows`
   result makes the rule `follows`, again with the unjudged scenarios listed (amended 2026-11-11).
   Only when no scenario could judge the rule is it `inconclusive`. The rule is `not-applicable`
   only when every covering scenario is not applicable. Every rule verdict records each covering
   scenario's own result as its `basis`, so a page shows which recording decided it.

   *Amendment, 2026-11-07 (the owner).* The first version let any `inconclusive` outrank `differs`.
   Measuring Atlassian showed the cost: Shift+Tab stopped on a remove button in all three runs, but
   `tab-out` could not judge (the demo page has nothing focusable after the component), so the
   stable difference disappeared from the verdict and its reason. A reproduced difference stands on
   its own. Unreliable runs still outrank it, which also keeps the contracts invariant that a
   `consistent: false` measurement has at least one `inconclusive` verdict.

   *Amendment, 2026-11-11 (the owner).* "Follows" no longer needs every scenario to agree; it needs
   one scenario that follows and none that differs. React Aria showed the cost of the old rule: its
   click removal kept focus in the field, but Backspace and Delete from the input removed nothing,
   so "Keep focus in the field" read "Nothing removed to judge" while the page replayed the click
   removal keeping focus. A judged result now stands on its own in both directions. Re-aggregating
   the 2026-11-10 recordings under this rule changed two verdicts: React Aria `keep-focus` and
   Chakra UI `tab`, both from `inconclusive` to `follows`. Engine 0.9.0.

Reasons identify the scenario that supplied the evidence. Evaluator exceptions are engine bugs, not
target behavior. A captured run therefore remains `completed`; the diagnostic result marks affected
rules `inconclusive` with the neutral reason `Evaluation did not complete`, while the detailed engine
error is reported only through `PatternRunResult`. Such a result is never written as canonical data
under `data/measurements/`; the CLI may preserve it as a local diagnostic artifact, then exits
non-zero. Setup failures, target behavior and stable `differs` verdicts are measurement outcomes, not
fatal engine errors.

Run comparison removes only nondeterministic and debugging fields: `Announcement.at`, `Settle.ms` and
`FocusInfo.path`. Verdicts and every other semantic observation field must agree. Provenance
`consistent` is true only when every requested run of every scenario completed and normalized runs
agree. Setup failures and errored runs make it false even when repeated identically. Therefore any
`consistent: false` measurement has at least one final `inconclusive` verdict, matching the contracts
schema invariant.

The runner still executes and stores every requested iteration after setup or action failure, because
the contracts schema requires each scenario to retain `provenance.runs` entries. Before comparison,
unordered AX diff collections are sorted by a stable semantic key; step order, announcement order and
speech-line order remain significant.

`Settle.quiet` remains part of semantic comparison. A change between reaching quiet and hitting the
one-second cap is evidence of nondeterminism worth surfacing, even when the exact `Settle.ms` is
ignored.

### Pattern suites and invariants

A suite is the shell-level registration point for what varies by pattern:

```ts
interface PatternSuite<State, InteractionId extends string> {
  pattern: Pattern;
  scenarios: readonly ScenarioDefinition<State, InteractionId>[];
  evaluators: Readonly<Record<RuleId, Evaluator>>;
  targets: readonly TargetFactory<State, InteractionId>[];
}
```

The suite module may import pure evaluators, but evaluators never import the suite. This preserves the
functional-core / imperative-shell dependency direction.

A `definePatternSuite` constructor checks once at registration:

- scenario ids are unique;
- every scenario rule exists in `pattern.rules`;
- every scenario has at least one rule and one step;
- every pattern rule has exactly one evaluator and at least one covering scenario;
- there are no evaluator keys for unknown rules;
- target ids are unique.

These checks fail before a browser is launched. Output data is still parsed with the measurement
schema and checked against the pattern before it is written.

`Adapter<State, InteractionId>` loses the `ChipsState` default. Pattern-specific state and
interaction-id types live beside their scenario definitions rather than in the shared adapter module
or engine public exports. The existing `ChipsState` public export is removed.

Successful setup returns a short description of the state actually reached. The published
`Scenario.initialState` uses that factual target-specific description, not the requested intent.
Descriptions from repeated runs must agree; disagreement makes the scenario inconsistent. An adapter
that cannot reach an equivalent state returns a setup failure rather than silently describing a
near-match as exact.

If every run fails during setup, `Scenario.initialState` is the factual
`Initial state was not reached`; each run carries its specific setup-failure reason.

### Target factories and lifecycle

The suite pairs scenarios and adapters through target factories carrying the same `State` type:

```ts
interface TargetSession<State, InteractionId extends string> {
  adapter: Adapter<State, InteractionId>;
  close: () => Promise<void>;
}

interface TargetFactory<State, InteractionId extends string> {
  id: string;
  open: () => Promise<TargetSession<State, InteractionId>>;
}
```

The reference factory starts its local server on a free port, creates the adapter with that base URL
and closes the server through `TargetSession.close`. Public targets return an adapter whose close
operation is a no-op. Browser session lifecycle remains owned by the generic runner.

Alongside `setup`, an adapter resolves a semantic click interaction:

```ts
resolveClickTarget: (
  page: Page,
  id: InteractionId,
) => Promise<{ ok: true; locator: Locator } | { ok: false; reason: string }>;
```

Failure to reach a target interaction is an expected target failure, stored as an errored run with a
factual reason and aggregated to `inconclusive`; an unknown interaction id is a registration or
adapter bug and is reported as a fatal engine error.

The runner always calls both target and browser cleanup in `finally`, including setup, evaluator and
serialization failures.

### Type-erased CLI registry

The CLI needs a registry containing suites with different `State` types. `registerPattern` closes
over one suite's state and exposes this concrete, non-generic entry:

```ts
interface RegisteredPattern {
  pattern: Pattern;
  scenarioIds: readonly string[];
  targetIds: readonly string[];
  run: (options: PatternRunOptions) => Promise<PatternRunResult>;
  debug: (options: PatternDebugOptions) => Promise<void>;
}
```

`PatternRunResult` is a discriminated union:

```ts
type PatternRunResult =
  | { status: 'measured'; measurement: Measurement }
  | { status: 'failed'; error: string; measurement?: Measurement };
```

This keeps expected inconclusive target outcomes separate from engine failures without claiming that
a diagnostic measurement can always be assembled.

A measurement attached to a failed result must still pass the complete measurement schema and
pattern checks: all requested runs are kept and every rule has a verdict. "Partial" means some
verdicts are honestly inconclusive, never missing scenarios or rules. Failed results are diagnostic
artifacts, not canonical measurements.

The registry stores `RegisteredPattern`, never `Adapter<any>`, `Adapter<unknown>` or cast suite
objects. Metadata supports CLI help and validates `--pattern`, `--target` and optional `--scenario`
before invoking the closed-over operation.

The debug command remains a capture diagnostic. It names a registered pattern, target and scenario,
then optionally overrides that scenario's action sequence with `--keys`. It uses the scenario's setup
intent instead of hard-coded chip names and must not become a second runner.

`--scenario` on the measurement command is diagnostic-only. It returns a separate diagnostic shape
containing the selected contracts `Scenario` and its per-rule `VerdictResult` values; it is not parsed
or serialized as a `Measurement`. It may be stored outside `data/measurements/` and is never
published as canonical pattern data.

### Evaluator checks

Evaluators stay as short plain functions. M1 does not create an assertion DSL or configurable
evaluator framework.

PR 2 implements AX diff and speech synthesis only. While writing the input-with-chips evaluators in
PR 3, small semantic predicates may be kept inside that feature. A predicate moves into shared core
only after repeated use demonstrates that it has the same meaning and reason to change, following
the Rule of Three.

## Deliberate non-decisions

- **No shared reference widgets in M1.** `roving-focus`, announcer or listbox modules are extracted
  when combobox provides a second real consumer.
- **No system base adapters in M1.** In M2, an adapter is still written for each
  system-and-pattern pair. Shared version discovery, Storybook readiness or navigation moves to
  `adapters/<system>/system.ts` only when another pattern for that system repeats it.
- **No evaluator DSL.** Short rule evaluators composed from plain functions are preferred.
- **No Atlas implementation in this ADR.** M3 may consume stable domain data such as `Rule.keys`,
  but its mount and motion contracts are separate site decisions.

## Repository placement

- `scenarios/input-with-chips.ts`: state type and `ScenarioDefinition` values.
- `evaluators/input-with-chips/`: one pure module per rule plus feature-local predicates.
- `suites/input-with-chips.ts`: suite definition.
- `suites/define-pattern-suite.ts`: registration-time invariant checks shared by suites.
- `adapters/reference.ts`: pattern adapter; its target factory is wired by the suite.
- `runner/`: generic scenario execution, run comparison and rule aggregation.
- `cli/`: type-erased registry selection and presentation.

`evaluators/` remains functional core. `suites/`, `scenarios/`, `adapters/`, `runner/` and `cli/`
are shell. PR 3 extends the ESLint dependency-boundary rules so core modules cannot import suite,
scenario, adapter, runner or CLI modules.

## Consequences

- Capture, run comparison, flaky detection, measurement serialization and the CLI can work without
  knowing which pattern they execute.
- A new pattern supplies content, scenario definitions, evaluators, a reference implementation and
  target adapters; the shared capture layer does not change.
- Some duplication is intentionally allowed until a second or third consumer proves a common
  abstraction.
- Registration adds a closure and target lifecycle boundary, but preserves strict typing without
  casts and supports the reference server's dynamic URL.

## M1 and M2 sequence

1. **M1 PR 2:** implement AX diff and speech synthesis with unit and property tests. Do not add
   evaluator helpers without a consumer.
2. **M1 PR 3:** add `ScenarioDefinition`, input-with-chips evaluators, suite validation, target
   factories, type-safe registration, the generic runner and rule aggregation. Replace chip-specific
   setup in the debug command.
3. **M2:** add real target adapters. Introduce a system-level adapter module only when measured
   duplication exists.
4. **M4:** use combobox as the test of the suite boundary and the first opportunity to extract shared
   reference modules.

## Amendment (2026-11-16): what a reference must measure

Decided by the owner with the menu button's `home-end` rule.

- **The invariant.** A reference differs on no rule of its pattern. For an unconditional rule that means `follows`. For a conditional rule it means `follows` or `not-applicable`: the reference may simply not meet the condition. It is never `differs` and never `inconclusive`. Until now the wording was "follows on every rule", which no conditional rule could satisfy for every sound reference.
- **Why it came up.** APG asks for Home and End in a menu only "if arrow key wrapping is not supported". The menu button reference wraps and has both keys, as the APG example does. Judging the two keys there would have made a menu that does more than the source asks `follow`, while one that does exactly what it asks dropped out of the count as not applicable. Optional behavior is recorded and shown as an observation, not judged; the same holds for Down Arrow and Up Arrow on the button.
- **Where it is written.** `CLAUDE.md` (scope) and `packages/reference/CLAUDE.md`.

## Amendment (2026-11-17): a rule's own words when every scenario follows

Approved by the owner after a verdict audit of the scenario rows.

- **The rule.** The summary of a rule that follows or differs is the summary of its first deciding scenario (one that no scenario could judge joins what each says). A suite may give a rule a phrase of its own (`summaries` in the suite), used only when the rule follows and every scenario that covers it follows. The verdict, the reason and each scenario's own result are untouched.
- **Why it came up.** `chip-stop` has two scenarios, one key each. Each now says what its key did ("Tab leaves the chips"), so that a row never claims the whole rule; taken as the rule's summary, that described a rule about Tab and Shift+Tab by one of them.
- **Where it is written.** `summarizeRule` in `packages/engine/src/model/rule-verdict.ts`; the phrase for `chip-stop` in `packages/engine/src/suites/input-with-chips.ts`. History: ADR 0009, 2026-11-17.

