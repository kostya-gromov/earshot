# 0010. Home page: illustrations that move, and what may arrive on scroll

- Status: accepted (2026-11-14)
- Scope: `apps/atlas/CLAUDE.md` (Visual language, Motion), `apps/atlas/src/features/home/`,
  `apps/atlas/src/ui/arrival/`

## Context

Until 2026-11-13 the home page had one moving thing, the measured recording at the top: the
design review of that day made the pattern drawing still ("it played a sequence no recording
shows") and replaced the method section's schematic plates with a real measurement ("showing,
not telling"). The motion rule had three tiers: Signature, Functional, Micro.

On 2026-11-13 and 14 the owner asked for a home page at the level of Linear with motion that is
interesting, for the method section to speak for every pattern and not one key of one, and for
figures that react to the pointer. A first pass added a separate section of three isometric
figures and slide-in arrivals on three sections. The design review of 2026-11-14 found that the
figures section read as Linear's own block and repeated the method's recording step, that the
page was four three-column rows in a row, and that the new motion fitted no tier.

## Decision

1. **Three more motion tiers**, written into `apps/atlas/CLAUDE.md`:
   - _Illustration_: a drawing of what the engine observes, shown with a measured count. It plays
     one run under 2 s when first seen and again when pointed at or tapped, always to its end and
     back to the resting drawing. It never loops.
   - _Arrival_: once, when first seen, a drawing may fade in (opacity only, 300 ms at most) and
     a meter may grow to its measured value (500 ms at most). Text, counts and links are never
     hidden and nothing slides. A meter that grows shows its value arriving; a meter that only
     fades shows nothing (2026-11-14, after the second design review).
   - _Load_: a page's opening (its statement and its scene) may come in once on load as one
     sequence (the statement, then the scene), 1.3 s at most in all, rising at most 12 px. It is the one place text may start
     hidden. The home page had this before the tiers were written; the third review of
     2026-11-14 found it fitted none, and the owner chose to name it over removing it.
     All three are off under `prefers-reduced-motion`.
2. **Figures live inside the method section**, in its recording step, each over its count from the
   measurement files (steps where focus moved, the accessibility tree changed, a live region
   announced). There is no separate figures section and no figure without a number.
3. **The method section shows totals across every measured pattern**
   (`apps/atlas/src/lib/method-totals.ts`), as three steps down the page: the first on the shared
   split, the recording and the verdicts across the full width. It no longer shows one rule, one
   recorded step and one verdict of input-with-chips. Recordings and verdicts are both counted
   from the design systems in each pattern's agreement figures (verdict audit 2026-11-14).
4. **No boxed surfaces for these numbers.** Totals and reader links sit on hairlines; the page
   keeps one elevated surface.

## Consequences

- The e2e test that allowed nothing but the measured scene to move by itself now allows the
  figures' single runs and checks that they end (WCAG 2.2.2: under five seconds, no pause needed).
- The pattern drawing in the patterns list stays still: it is not shown with a count, so it is
  not an Illustration.
- One point of the 2026-11-14 review was not taken: redrawing the figures flat. They keep their
  isometric view; what quoted Linear (the "Fig." labels, the vertical hairlines, the standalone
  three-up block) is gone. Open for the owner to overrule.
- New figures elsewhere must meet the Illustration rule or stay still.

## Amendment (2026-11-15): step 1 of the method has a figure and meters too

Asked for by the owner. Step 1, "Rule", was a list of cited pages beside an empty column, while step
2 had a large count, three figures and counted rows.

- **One series.** Each of the three steps now has a large count, something drawn, and counted
  rows with a meter: 18 rules, a figure, two levels; 798 steps, three figures, three channels; 92
  verdicts, one bar, four outcomes.
- **The figure shows how a rule is made**, not decoration: a sheet of WCAG and a sheet of APG, one
  passage marked on each, a connector from each passage to the rule's card. It carries three small
  labels (WCAG, APG, Rule); the recording figures carry none.
- **Greys only.** Blue and violet mean focus and speech on this site; a rule is neither. The
  meters for "From the standards" and "Atlas recommendations" are neutral for the same reason.
- **Its run meets the Illustration rule** and uses only transform and opacity: a mark leaves each
  passage, reaches the card, the card lifts once; 1.4 s, once when first seen and again when
  pointed at; nothing runs under reduced motion.
- **The left column is sticky** beside the list from 861 px; below that the order is title,
  count, figure, levels, list. The list is grouped, WCAG then APG, each with its count.
- **After the design review of the same day.** The count leads the right column, level with the
  title, where steps 2 and 3 have theirs; the left column keeps the title, the figure and the
  meters. In the run the marks travel first, at an even pace, and the card lifts only when they
  arrive. The run starts when most of the figure itself is on screen, not when the block's top
  edge is. The column is not sticky in a window shorter than 760 px. On a phone the figure is
  capped at 240 px wide. APG rows say what kind of page each is (Practice, Pattern, Example).
- **The figure is captioned with what it covers** (2026-11-15): "How 11 of 18 rules are
  built. The other 7 are Atlas recommendations; each says why." A drawing must not promise more
  than the numbers beside it. The list says "11 pages cited" over its groups, so pages are not
  read as the 11 rules from the standards, and a standard whose pages are partly applied and
  partly only related lists them under "Applied" and "Related, not applied directly".
