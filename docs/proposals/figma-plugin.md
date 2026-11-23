# Proposal: an Atlas plugin for Figma

Status: opened by the owner on 2026-11-21 with every decision as recommended. Steps 1 to 3 are
done; the plugin was submitted to Figma's review from the owner's personal account on
2026-11-22 (see "Progress").

Scope note: CLAUDE.md section 3 lists "Figma plugin, annotations, Code Connect" as out of scope
until the owner says so. The owner opened one part of it the same day (a `.fig` file for one
pattern, `figma-annotated-elements.md`) and then asked for this proposal. A published plugin is a
larger step than that file and needs its own go-ahead.

## Problem

The `.fig` file works, and it is not dynamic. Each pattern needs a board drawn in Figma and a
"Save local copy" by hand, because the format is closed. When a requirement changes, the file is
stale until someone repeats that. A designer also gets a separate file to copy from, not the
element in the file they are working in.

## What is proposed

A plugin, published to Figma Community, that a designer runs in their own file. They pick one or
more patterns; the plugin draws each as a board on the current page: the grey wireframe of the
element, a numbered pin per requirement, and the notes with reasons and linked sources. The same
board as the `.fig` file holds today, with no file and no manual save.

The drawing code exists and is already written as plugin code: `apps/atlas/figma/` (element,
pins, notes, board) with `scripts/figma-plugin.ts` building a development plugin from it. What
is new is a way to choose patterns, drawings for the other patterns, the listing, and the
publishing.

The plugin shows requirements only: hand-written, each with its source. It shows no measured
behaviour of any system, so principle 1 is not in play. If verdicts ever go into it, they go with
their provenance or not at all.

## What Figma's documentation says (read 2026-11-21)

- **Publishing is open to the Starter plan**, from the desktop app only, with two-factor
  authentication on. A plugin is published as a person, a team or an organization.
  (help.figma.com, article 360042293394)
- **The listing needs** a name, a tagline, a description, a category, an icon (recommended 128
  by 128), a thumbnail (recommended 1920 by 1080) and a support contact. A data security form is
  optional; its review "may take up to two weeks". (same article)
- **There is a review before listing.** "Approval times vary depending on current volume and the
  team's availability." No number of days is given. (same article)
- **Whether an update is reviewed again is stated two ways.** The guidelines: "Any material
  updates to your plugin or widget are subject to re-review" (article 360039958914). The page on
  managing plugins: "Once Figma approves your plugin, you don't need to submit your plugin for
  further review" (article 360042293714). To be found out with the first update.
- **A new version reaches everyone**: "Figma will update the plugin for everyone that has it
  installed." Users cannot go back to an earlier version. (article 360042293714)
- **The review looks at** completeness, accurate descriptions, design, performance, security, API
  usage, clear external connections. Stated: Figma "may reject plugins or widgets that read or
  modify a Figma file without a user's explicit awareness and consent". (article 360039958914)
- **Network access is declared in the manifest** (`networkAccess.allowedDomains`, at least one
  entry); anything else is blocked. A plugin's interface runs with a `null` origin and "will only
  be able to call APIs with `Access-Control-Allow-Origin: *`".
  (developers.figma.com/docs/plugins/manifest, /making-network-requests)
- **The manifest's `id` is assigned by Figma**, and `documentAccess: "dynamic-page"` is required
  for new plugins. Ours already sets it. (developers.figma.com/docs/plugins/manifest)
- **A choice without an interface** is possible through plugin parameters: "a way to receive user
  input without building a UI". (developers.figma.com/docs/plugins/plugin-parameters)
- **Publishing privately to an organization** is on Organization and Enterprise plans and is not
  reviewed.

Not stated on the pages read:

- whether publishing is free (no line says so; paid plugins need an approved creator);
- whether a plugin may write `node.annotations` for a user on a paid seat. Our trial of
  2026-11-21 saw the write and the read refused on Starter with a View seat; nothing was tried on
  a paid seat.

## Decisions for the owner

1. **Open this scope, alongside M5?** Recommended: yes, in the order of work below, with the
   plugin kept a development plugin until step 3. Until then nothing is public and nothing is
   hard to undo.
2. **Where the plugin's text comes from.**
   - _Built in at release_ (recommended). The requirements are written into the plugin when it
     is built, as now. No network access to declare, nothing to explain in review, works
     offline. A changed requirement needs a new version, which reaches every user. The
     fingerprint that guards the `.fig` today guards the published plugin the same way: a test
     goes red when the published version no longer matches contracts.
   - _Fetched from the site._ The text is always current. It costs a declared domain, a JSON file
     on the site served with `Access-Control-Allow-Origin: *`, a failure state when the site is
     unreachable, and a plugin that breaks if the site's address changes. It also buys less than
     it seems: a new requirement needs a pin and a new pattern needs a drawing, and both are
     plugin code, so a new version is needed anyway.
3. **How the designer chooses.** Recommended: a small window listing the patterns with a button
   "Add to this page", keyboard operable, and held to principle 4 like the site. Plugin
   parameters (a choice typed into Figma's quick actions, no window) can be added on top.
4. **Who draws the other elements.** Today one element is drawn, by hand-written code. Combobox,
   menu button and tabs need theirs (dialog waits for its page). Recommended: write these three
   by hand, as neutral as the first. Deriving the drawing from the reference implementation
   would remove that step for every later pattern; it is untried and is a proposal of its own.
5. **Native annotations.** Recommended: not in the first version. Notes as layers open on any
   plan. Writing Figma's own annotations as well, where the user's seat allows it, is step 5 and
   needs a paid Full seat to build and test with. Whose?
6. **The account and the name.** Recommended: published from the owner's personal account, as a
   person, under the name "Earshot Atlas". The employer's organization is not used. The name,
   tagline and description are the owner's to approve; drafts come with step 3.
7. **What happens to the `.fig` file.** Recommended: it stays on input-with-chips until the
   plugin is listed, then the page links to the plugin and the file goes. Two ways to the same
   board is one too many to keep current.

## Progress

**Step 1, 2026-11-21: built, not yet run in Figma's desktop app.**

- `node scripts/figma-plugin.ts` (from `apps/atlas`) writes the plugin to `figma/out/plugin/`:
  `manifest.json`, `code.js`, `ui.html`. One plugin for every pattern that has a drawing; it
  replaces the per-pattern script the `.fig` was drawn with.
- The window (`src/lib/figma-plugin-window.ts`): a checkbox per pattern with its count of
  requirements, what will happen in one sentence, a button "Add to this page", a status line.
  Escape closes it. It uses only Figma's text and background colours: white on Figma's brand
  blue (`#0d99ff`) is under 4.5:1, and the value of its secondary grey was not read.
- The entry (`figma/plugin.ts`): shows the window, fits it to the height the window reports,
  adds a board per chosen pattern, selects the new boards and brings them into view. It adds
  frames and touches nothing else. It is not part of what a `.fig` is fingerprinted from.
- The manifest declares `networkAccess: { allowedDomains: ["none"] }`, the documented value for
  a plugin that makes no requests (developers.figma.com/docs/plugins/manifest).
- Tested outside Figma: the joined script starts and answers the window's messages against a
  stand-in for Figma's global (`test/unit/figma-plugin-files.test.ts`); the window by keyboard,
  its messages and axe in a browser (`test/figma-plugin-window.spec.ts`).
- **Not tested: anything inside Figma.** The window in Figma's frame and theme, the resize, the
  selection and the scroll into view, the notice. That is the owner's run: Plugins, Development,
  Import plugin from manifest, `apps/atlas/figma/out/plugin/manifest.json`.

**Step 1 accepted, 2026-11-21.** The owner ran the plugin in Figma's desktop app: the board for
input-with-chips was added to the page and selected. His screenshot shows the board; the window
itself and the notice were not in it.

**Step 2, 2026-11-21: three more elements drawn, waiting for the owner's look.**

- `figma/combobox.ts` (a label, a field with typed text, the open list with one option active),
  `figma/menu-button.ts` (the button, its open menu with one item in focus) and `figma/tabs.ts`
  (three tabs, one selected and another in focus, and the panel), with `figma/layout.ts` for
  what they share and `figma/drawings.ts` as the list of elements. Pins in
  `src/lib/figma-board-pins.ts`: six, five and four, one per requirement.
- Drawn by that code in the trial file, on the page "Step 2: combobox, menu button, tabs", run
  through Figma's MCP server. Screenshots: `design-review/2026-11-21-figma-plugin/board-*.png`.
  The rebuilt plugin offers all four patterns; with four it has not been run from the desktop
  app.
- **The fingerprint of a saved `.fig` is now per pattern**: the shared drawing modules, that
  pattern's own element, its board and the site's address. Before, it covered every drawing
  module, so adding a combobox would have declared the input-with-chips file stale. The
  input-with-chips record was written again under the new definition without a new save: the
  old fingerprint still matched immediately before the change, and none of the modules the new
  one covers was touched.
- One requirement has no picture of its own: "The focused item is never entirely hidden under
  other content" is pinned to the menu's corner, since the drawing has nothing that covers it.

**Step 2 accepted, 2026-11-21.** Committed with step 1 (`f54bbbc`).

**Step 3, 2026-11-21: the listing is drafted; the submission is the owner's.**

- Pictures: `apps/atlas/figma/listing/icon.png` (128 by 128, the Atlas mark) and
  `thumbnail.png` (1920 by 1080: the name, one sentence, and a screenshot of the real
  input-with-chips board), made by `node scripts/figma-listing.ts`.
- Texts: `apps/atlas/figma/listing/listing.md`: name, tagline, description, and what is left to
  the owner (category, support contact). The description says what the plugin adds, that it
  changes nothing else, that it makes no requests, and what it does not do.
- Against the review guidelines read on 2026-11-21 (article 360039958914), by their headings:
  - _Completeness, accurate descriptions_: four patterns, each drawn and described as it is.
  - _Awareness and consent_: nothing happens before "Add to this page"; the window says what
    will be added and that nothing else changes.
  - _Security, external connections_: no network access, declared as none; the only addresses
    are links in the notes, to w3.org and to the site.
  - _Account requirements, advertisements, AI functionality_: none of the three.
  - _Performance_: not measured. A board is one frame with a few dozen layers.
  - _Legal_: not assessed by anyone qualified. The notes paraphrase and link WCAG and APG; they
    do not copy their text.
- The owner approved the texts, the pictures, the category and skipping the data security
  form as recommended (2026-11-21). The support contact is the public repository's issues if
  the form takes a link.
- Left to the owner: two-factor authentication on the personal account and the submission from the desktop app (Plugins, Manage
  plugins, Publish). Figma assigns the plugin's id at that point; it then goes into
  `scripts/figma-plugin-files.ts` in place of the development id.

**Submitted for review, 2026-11-21.** The owner published from the desktop app as an individual
creator, to Community, with "No network access" shown by the form. Figma assigned the id
`1706093283242416989`, now in `scripts/figma-plugin-files.ts`. Figma's answer: "We have received
your submission. Our team will review this resource and contact you when it's ready." Step 4
waits for that. The data security form was offered as a step of the same form, not separately.

The plugin's page, for the link on the site in step 4:
https://www.figma.com/community/plugin/1706093283242416989. Not opened from here, and before
Figma's approval it is not expected to be public.

**The account, found the same evening.** The plugin was submitted from the Figma account whose
login is the owner's work address. "Individual creator" and the personal team are a profile and
a plan inside that account, not a separate account; the personal address typed into the form is
only the listing's support contact. Decision 6 meant a personal account, and this proposal
wrongly called the personal team one. Figma's pages (read 2026-11-21): "You cannot transfer
ownership of plugins published outside of an organization" (article 360042293714); a removed
plugin cannot be restored and loses its installs (same article); a profile handle can be changed
at any time (article 360038510833). Changing an account's email address was not on the pages
read. So the way to a personal account is to remove this submission and publish again from that
account, with a new id, while there are no installs to lose.

**Submitted again from the personal account, 2026-11-22.** The owner unpublished the first
submission in the work account, signed in to his personal account and went through the same
form. Figma assigned a new id, `1706232314661494735`, now in `scripts/figma-plugin-files.ts`,
and the plugin's page is https://www.figma.com/community/plugin/1706232314661494735 (the
address the owner sent; not opened from here). The id and the address of the first submission
above are no longer in use. Step 4 waits for Figma's review.

**What the first version is not.** The owner asked whether this is what was wanted at the
start: an element with real annotations. It is the element with every requirement beside it as
notes that are ordinary layers; it does not write Figma's own annotations. Those are step 5, and
writing them has never been tried on a paid Full seat. Recommended: add them in an update, for
users whose seat allows it, once someone with a Full seat can run the plugin once.

**Step 5, 2026-11-22: written, not released, and the write that succeeds is unseen.** Opened by
the owner on the condition that it can go out without a Full seat to test with.

- The window has a box "Also add Figma annotations (needs a Full seat on a paid plan)", off to
  begin with. Ticked, the plugin writes one annotation on each pinned layer: the title in bold,
  the reason, the sources as links (`src/lib/figma-board-annotations.ts`, built into the plugin
  as data; `figma/annotations.ts` assigns it). One annotation per layer, with both notes when
  two requirements share a layer: Figma's REST API reads "a maximum of 1 annotation" per node,
  and whether the Plugin API takes more was not found out.
- The notes as layers are always drawn. The annotations are an addition, and a refusal leaves
  the board as it is today, with a notice: "Figma annotations need a Full seat on a paid plan,
  so the notes are layers only."
- **Seen:** the refusal. The repository's function, run in the trial file through Figma's MCP
  server on the Starter plan with a View seat, got "you don't have permission to edit
  annotations on this file", caught it and read it as a refusal. The window's box and its
  message are tested in a browser.
- **Not seen:** a write that succeeds. Whether the markdown is taken as written (if Figma throws
  on it, the same words are written plain), how the annotation looks in Dev Mode, whether its
  length is limited, and whether a second annotation per layer would be allowed.
- **Not released.** The version in Figma's review was submitted before this and does not have
  the box. The build in the repository does: publishing a new version from it, also to answer a
  request from the review, ships the box. To release it: either someone with a Full seat runs
  the build once first, or the owner decides to release it unseen, and then the listing says it
  is new and was not tried on a paid seat (the sentence is drafted in `listing.md`).

**On the site and a fifth pattern, 2026-11-23.**

- **The page says the plugin is coming.** In "For design", at the start of the row with "Copy
  all N for Figma": "Figma plugin", a pill "In Figma's review", and "Will add this pattern to
  your own file, with its requirements as numbered notes." Shown for every pattern the plugin
  draws (`boardPins`), so it cannot appear for one it does not. When the plugin is listed this
  line becomes the link of step 4. The design review's three findings were taken: the sentence
  has a line of its own below 1024 px (between 820 and 980 px the controls had split over two
  lines), the label leads by weight and not by the brightest ink, and the copy is future tense
  with whose review it is.
- **Modal dialog is drawn**: `figma/dialog.ts` (the page behind dimmed, a dialog with a title, a
  close button and two actions, focus on the less destructive one) with six pins. Drawn in the
  trial file by that code. One pin was moved in the data afterwards (the close button's target
  size, from on its edge to past it) and that board was not drawn again: Figma's MCP server
  reached the Starter plan's call limit.
- **The box for Figma's annotations is a build option**, `node scripts/figma-plugin.ts
  --annotations`, and off without it. The update with the dialog goes out without the box.
- **The update is the owner's to publish** (Plugins, Manage plugins, Publish new version), with
  the description's list of patterns and the thumbnail brought up to five. The version in
  review has four; until the update is in, the line on the dialog's page is ahead of it.

**The update with the dialog was published by the owner, 2026-11-23**, from the build without
the annotations box, to the same page. Whether that page is public yet is not known here: an
anonymous request to it was refused (HTTP 403), which says nothing either way. The line on the
site stays "In Figma's review" until the owner says the plugin is approved.

## Order of work

Each step ends with something the owner can see, and the next does not start before he accepts.

1. **The plugin runs from Figma's desktop app** as a development plugin, for input-with-chips,
   with the window of decision 3. So far the drawing code has run only through Figma's MCP
   server. Shown: a recording or screenshots of the run in the owner's file.
2. **Three more elements**: combobox, menu button, tabs, each with its pins, drawn in the trial
   file for the owner to look at before anything else.
3. **The listing and the submission**: icon, thumbnail, name, tagline, description, support
   contact; submitted by the owner from the desktop app. Then the wait for Figma's review, of
   unknown length.
4. **The site**: "For design" links to the plugin on every pattern that has a drawing; the info
   tip's text changes; design review. The `.fig` goes (decision 7).
5. **Native annotations where the seat allows**, if a paid seat is found (decision 5).

## What it costs to keep

- A new version for every change to a requirement's text, a pin or a drawing (decision 2), and
  for every new pattern.
- A support contact that someone reads.
- Figma's Plugin API version and review guidelines, which change on Figma's schedule.

## Stop or rethink

- If the designers in M5 do not use the `.fig` file, a plugin will not change that: stop before
  step 3.
- If Figma's review asks for something that conflicts with a principle (an account wall, usage
  tracking), stop and bring it to the owner.
- If the listing is rejected twice for reasons we cannot meet, fall back to the `.fig` files.

## Not checked

- Publishing itself: no plugin of ours has been submitted, so everything about the review is
  from Figma's pages, not from experience.
- Whether publishing is free.
- The plugin's window under a screen reader inside Figma.
- Figma's pages on stability and updates, two-factor authentication, creator profiles and
  private organization plugins were not read.
