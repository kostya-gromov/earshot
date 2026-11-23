# Proposal: annotated elements for Figma

Status: opened by the owner on 2026-11-21 (decision 1: the trial and one pattern, alongside M5).
Decisions 2, 4 and 5 are settled below; input-with-chips has its file and its download.

Scope note: CLAUDE.md section 3 lists "Figma plugin, annotations, Code Connect" as out of scope
until the owner says so. This proposal is the way in that the same section asks for.

## Problem

"For design" lists a pattern's requirements, and "Copy for Figma" copies each as plain text. The
designer still draws the element and creates every annotation by hand, one paste at a time. The
owner wants the designer to get the element itself, or several, in Figma with the annotations
already on the right layers.

## What Figma's documentation says (read 2026-11-21)

Stated by the docs:

- **A plugin can write annotations.** `node.annotations = [{ label }]`, with `label`,
  `labelMarkdown`, pinned `properties` and `categoryId`. Supported on components, component sets,
  frames, instances, text, vectors and basic shapes; not on groups or sections.
  (developers.figma.com/docs/plugins/api/Annotation)
- **Adding annotations by hand** needs a Full seat on a paid plan and edit access. **Viewing**
  them: "You can view them with a Full or Dev seat and at least view access to the file."
  (help.figma.com, article 20774752502935)
- **Importing a `.fig` file** is on all plans: "Anyone can import files into their drafts."
  The format is "proprietary and may change in the future", so we cannot generate it ourselves;
  a `.fig` can only come out of Figma's "Save local copy". (articles 360041003114, 8403626871063)
- **A Community file** is duplicated as "a new copy, without any updates, version history or
  comments". (article 360040035974)
- **The REST API** reads annotations and notes "a maximum of 1 annotation is supported" per node.
  No write endpoint was found on the pages read.

Not stated by the docs, to be found out by trial:

- whether annotations survive "Save local copy" then import, and a Community duplicate (the pages
  name comments and version history as dropped and do not mention annotations);
- whether a designer on the free Starter plan sees annotations at all;
- any documented way to put Figma layers on the clipboard from a website. None was found, so a
  richer "Copy" button that pastes layers would rest on an undocumented format.

## Trial, 2026-11-21 (first part)

Run through Figma's MCP server (Plugin API) in a new draft on the owner's personal team: Starter
plan, View seat. The owner's other plan is an employer's organization with a Dev seat; it was
not used.

- **Layers: yes.** A grey wireframe of the element (label, field, three chips: rest, focused,
  invalid, hint, error text) was drawn by script.
- **Native annotations: refused on the free plan, both ways.** Writing: "Cannot call
  node.annotations: you don't have permission to edit annotations on this file". Reading, and
  listing categories: "you don't have permission to view annotations on this file". So a designer
  on Starter is not expected to see native annotations either; that is inferred from the API's
  refusal, not seen in Figma's interface.
- **Notes as ordinary layers: yes.** Seven numbered pins on the layers and a notes column with
  each requirement's title, reason and linked sources, on the same board. This works on any plan.

- **The `.fig` round trip: yes, on the owner's screenshots.** He saved a local copy and imported
  the `.fig` into the same free account ("Imported just now"). Both boards came back with the
  wireframe, the seven pins in place and the notes with the same wrapping. Not confirmed yet:
  that the source links still open in the imported file (the underlines are there; the links
  themselves were counted only in the original, nine of them), and an import into another
  person's account.

Still not tried, because it needs a Full seat on a paid plan: writing native annotations, and
whether they survive "Save local copy", import and a Community duplicate.

What this changes: decision 4 is no longer a fallback. Notes as layers are the base that every
designer gets; native annotations are an addition for paid plans, if a seat is found to build
and test them with.

## Owner's answers and the next step, 2026-11-21

The owner clicked a source link in the imported file (it opens) and accepted the look: a grey
wireframe, numbered pins, a column of notes. So decisions 2 and 4 are settled as recommended, and
decision 5 for now: the personal team, notes as layers, no paid seat.

Built the same day:

- `apps/atlas/src/lib/figma-board.ts`: a pattern's requirements as the notes of a board, plain
  data, with the words of the requirement itself. `figma-board-pins.ts` says which layer each
  requirement's pin sits on. A requirement without a pin, or a pin without a requirement, throws.
- The board in the trial file was read back and its seven notes and nine links carry the text
  and addresses of that data; a line "From Earshot Atlas" with the page's address was added.

Later the same day, with the owner's approval of `@figma/plugin-typings` 1.143.0 (types only, a
dev dependency of the site):

- **The drawing is code in the repository**: `apps/atlas/figma/` (shapes, the element, notes,
  board, entry), typed against Figma's plugin typings with its own `tsconfig.json`, linted like
  the rest. Figma's sandbox has no modules, so `scripts/figma-plugin.ts` strips the types, joins
  the modules into one script and writes a development plugin to `figma/out/<pattern>/`.
- **The board in the trial file was redrawn by that code** (run through the MCP server, the same
  functions without the type-stripped blanks) and looks as before, now with the "From Earshot
  Atlas" line. The plugin itself has not been run from Figma's desktop app.
- **A file cannot go stale unnoticed**: `scripts/figma-file.ts` records a fingerprint of what a
  saved file was drawn from (the drawing code, the board's data, the site's address) in
  `src/data/figma-files.json`, schema in contracts; `test/unit/figma-files.test.ts` goes red when
  a requirement or the drawing changes afterwards. The record is a statement by whoever saved the
  file: nothing here can read a `.fig`.

Late the same day:

- **The file is saved and recorded.** The owner saved a local copy of the trial file with the one
  board the repository's code drew. Before it went to `public/figma/` its data was decoded far
  enough to check: one board, 1034 by 849, the "From Earshot Atlas" line and the link ending in
  `#lens`. Two earlier saves had the old board and were not recorded.
- **The download is on the page**: a link "Download Figma file" beside "Copy all 7 for Figma" on
  input-with-chips, the only pattern with a record, and the info tip's text for that case
  (`design-lens.tsx`, tests in `test/copy-for-figma.spec.ts`).

After the design review the owner took both recommendations for the row: "Download Figma file"
is a link without a box beside the boxed "Copy all 7 for Figma", and the intro on a page with a
file ends "Each copies as text for an annotation in Figma; the file has them all as notes on a
drawing." What the review left open: `docs/follow-ups/figma-download.md`.

The owner then asked for the published plugin (option 3) as its own proposal:
`figma-plugin.md`.

Open: native annotations on a paid seat, an import into another person's account, and running
the development plugin from Figma's desktop app are still untried.

## Options

1. **A `.fig` file per pattern, downloaded from the site; built by our own script inside Figma**
   (recommended). A small development plugin, run by us and never published, reads the pattern's
   requirements from contracts, draws the element and sets each annotation on the layer it is
   about (chip, remove button, focus ring). We save a local copy and the site serves it. The
   designer installs nothing. The text comes from contracts, so it cannot drift from the site;
   the file is rebuilt when a requirement changes.
2. **A Community file.** Same file, published to Figma Community. One click for the designer and
   Figma hosts it, but it needs a publishing account, and a snapshot must be republished by hand.
   Can be added to option 1 later at little cost.
3. **A published Atlas plugin.** The designer runs it in their own file and picks patterns; it
   draws the elements and annotations there, always current. Fully documented API, the most
   work, a Community review, and something to maintain. Reasonable after designers use option 1.
4. **Layers through the clipboard.** Rejected: undocumented format.

## Recommendation

Option 1, for input-with-chips first, after a trial of about an hour in Figma: one annotated
frame, saved locally, imported into a free account and into a paid one. If annotations do not
survive, or the free plan does not show them, the same notes are also drawn as ordinary text
layers beside the element, which every plan shows.

"Copy for Figma" stays: it serves a designer who already has their own component.

## Decisions for the owner

1. **Open this scope now, alongside M5?** Recommended: yes for the trial and one pattern; M5 is
   where designers can tell us whether they use it.
2. **Who draws the element.** The page says "How to draw them stays with your team." A file we
   ship is a drawing. Recommended: a neutral wireframe of the reference implementation (structure
   and states, grey, no brand styling), and the sentence on the page changes to say so.
3. **Which states are in the file.** Recommended: the states the requirements name (rest, focus
   on a chip, focus on the input, error), as one component set.
4. **Notes as text layers too**, not only native annotations. Recommended: decide after the
   trial; yes if the free plan hides annotations.
5. **A Figma account to build and save the file from.** Annotations need a Full seat on a paid
   plan. Whose account?
