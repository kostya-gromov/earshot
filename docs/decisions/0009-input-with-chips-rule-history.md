# 0009. Input with chips: how the rules, scenarios and counting got their current shape

- Status: accepted (each entry dated below)
- Scope: `packages/contracts/src/patterns/input-with-chips*.ts`, its evaluators, the Atlas pages
- Moved here from CLAUDE.md on 2026-11-11 (ADR 0008): the current rules live in
  [docs/patterns/input-with-chips.md](../patterns/input-with-chips.md) and in contracts; this
  file keeps the history and the reasons.

## Timeline

- **2026-10-31.** `tab`: the input and its chips share one Tab stop. Tab and Shift+Tab from the
  input leave the field, and so does Tab from a chip.
- **2026-11-06.** Scenario `shift-tab-out` added: chips usually precede the input, so a Tab stop
  per remove control only shows going backwards.
- **2026-11-08.** Systems are measured from their published npm package in our own harness
  (ADR 0005). A verdict that differs is shown neutral with "≠", never red: differing is not
  failing. Token conventions removed from the "For design" lens: they are not accessibility and
  not measured. Components their own maintainers deprecated are shown but not counted toward
  agreement: agreement should describe what teams are advised to use.
- **2026-11-09 (verdict audit).** Each rule gets a level: **rule** (what a cited WCAG criterion
  or APG practice asks) or **recommendation** (Atlas's advice beyond them, labelled as ours).
  `keep-focus` relaxed: until then a click removal had to return focus to the input; now any
  place in the field counts (a neighbouring chip or the input). The reference still returns to
  the input. `count` is judged only where the removal is announced, so a silent removal is
  charged once, to `say`. Agreement is counted over the systems a rule could be judged on
  (follows or differs): "0 of 5 follow" had read as five systems that do not, when three could
  not be judged (see `apps/atlas/test/unit/agreement.test.ts`). Candidate systems extended with the most used component libraries
  (MUI, React Aria, Chakra UI; shadcn/ui planned), see `docs/proposals/more-systems.md`.
- **2026-11-10.** `chip-stop` and `chip-arrows` added as APG rules for the chips as one composite
  widget, with scenarios `chip-tab`, `chip-shift-tab`, `chip-arrows` that start on the last chip.
  `tab` became a recommendation: treating input and chips as one widget is Atlas's design, not
  APG's. The React Aria "separate grid" model trade-off no longer covers `chip-stop`, because
  APG's grid itself asks for one stop.
- **2026-11-11 (first verdict-auditor run, `docs/proposals/verdict-audit-2026-11-11.md`).**
  `chip-stop` and `chip-arrows` apply when the chips act as one widget, read from behaviour: arrow
  keys move between them. Chips that are separate controls in the tab sequence with no arrow keys
  (Atlassian) are what APG allows outside a composite widget ("either including them in the tab
  sequence or by making them accessible from a component that is in the tab sequence"), so both
  rules are `not-applicable` for them; their extra stops are still charged once, by `tab`. Not
  read from ARIA roles: the reference's own chips are buttons with no composite role. Engine
  0.10.0. Where a model explains a counted difference (React Aria's separate grid on `tab`,
  `arrows`, `bsp`), the verdicts stay and the agreement line says one design explains them.
- **2026-11-13 (target audit and two verdict-auditor rounds, `docs/proposals/target-audit-2026-11-13.md`).**
  Engine 0.11.0; the quiet window is 400 ms, counted from the action (ADR 0003, amendment).
  Three decisions about judging and counting:
  - **One principle for a marked chip**, for `bsp` and `arrows`, whose texts share the clause
    "moves focus to the last chip": a chip counts as marked when keyboard focus, the
    accessibility tree or an announcement shows it. Nothing of the three (a highlight on screen
    only) is **differs** in both rules. Focus in place while the tree changes or something is
    announced is **inconclusive** in both: the engine cannot read whether that puts the user on
    the chip. This replaces the decision of 2026-11-09 that left Chakra UI's `bsp` inconclusive
    while its `arrows` differed; Chakra UI's `bsp` is now differs, and its reason still says the
    removal took two presses. Not double counting: the two rules protect different things
    (knowing which chip is about to go; reaching the chips), as they do for every other system.
  - **`backspace-twice` judges the first Backspace that removes a chip** for `keep-focus`, `say`
    and `count`. Judging the second asked for a count one too high where a system removes at
    once.
  - **React Aria is shown, not counted.** Its measured version ships TokenField, a dedicated
    component for this pattern, and "a dedicated component wins over a composition"
    (`packages/engine/CLAUDE.md`). The engine cannot measure a field of that kind yet
    (`docs/proposals/engine-text-editing-model.md`), so the composition's verdicts stay visible
    with that reason and leave the agreement counts, as a deprecated component's do.
- **2026-11-15 (verdict audit of the two reviewed models, two rounds).** When a difference is a
  **model**: when, besides the recording, its mechanism is on record (described in the system's
  documentation, read in its source, or seen by hand with a date) **and has an effect a person
  can perceive**: on screen, in the accessibility tree or in an announcement. The recording
  alone never makes a model, and neither does a mechanism nobody can perceive. The second
  condition was added the same day: the first alone was also met by Atlassian. Applied to
  `arrows`, where Chakra UI and Atlassian have the same verdict reason. Chakra UI: a highlight
  that moves over the tags, seen by hand on 2026-11-13 and again on 2026-11-15 with its method
  (`data/targets.yaml`), so its model stands. Atlassian: its mechanism is on record (its own
  description names the arrow keys, and they move `aria-activedescendant` to an id no element
  has, seen 2026-11-13), but nothing changes on screen (seen 2026-11-15), in the tree or in an
  announcement (recording); it stays a plain difference. What is recorded and seen is shown
  with the system as observations, without a judgement. The count for one system reads
  "1 of 4 uses another model"; "share" is for two or more.
- **2026-11-17 (verdict audit of the scenario rows).** `chip-stop`: a scenario that follows says
  what its own key did, "Tab leaves the chips" or "Shift+Tab leaves the chips" (engine 0.16.3).
  Before, each said "The chips are one Tab stop", the rule's conclusion, which one key cannot
  show: React Aria's `chip-shift-tab` row read so under a rule that differs, because its Tab
  stops on a control inside the chip. A rule's summary is its first deciding scenario's
  (ADR 0004), which would describe a rule about two keys by one of them; so a suite may give a
  rule its own words for the case where every scenario follows (`summaries`, engine 0.16.4),
  and `chip-stop` keeps "The chips are one Tab stop" there. A difference, or a follows that
  rests on part of the scenarios, keeps the deciding scenario's words. All three patterns
  measured again on 0.16.4; no verdict and no reason changed. React Aria's recorded note about
  its tags is shown under `keep-focus`, `say` and `count` only and names the rules that judge
  the keys it mentions, where it used to repeat their reasons. On the site, a verdict
  reached by a precondition (Atlassian's not-applicable) records no result per scenario; its
  rows repeat the rule's verdict and say "The rule's verdict, not this scenario's".
