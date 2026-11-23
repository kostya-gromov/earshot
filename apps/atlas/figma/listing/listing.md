# The plugin's Community listing

Approved by the owner on 2026-11-21 as drafted. The fields are the ones Figma's publishing page asks for
(help.figma.com, article 360042293394). Pictures: `icon.png` and `thumbnail.png` in this folder,
made by `node scripts/figma-listing.ts`.

## Name

Earshot Atlas

## Tagline

Add a component pattern to your file with its accessibility requirements as numbered notes.

## Description

Earshot Atlas adds a plain drawing of an interactive component to your page, with what
accessibility asks of its design written beside it.

Choose one or more patterns and press "Add to this page". For each, you get a board with:

- a grey wireframe of the element in the states the requirements are about, such as an option
  in focus or an invalid chip;
- a numbered pin on the layer each requirement concerns;
- a note per requirement: what to decide, why it matters, and links to the WCAG 2.2 or WAI-ARIA
  APG page it comes from.

Patterns in this version: input with chips, combobox, menu button, tabs, modal dialog.

What it does to your file: it adds new frames to the current page. It does not read, change or
remove anything that is already there.

What it does not do: it does not check your own design, and it does not style anything. The
drawing is neutral on purpose; how the component looks stays with your team. The notes are
ordinary layers, so they are visible on every Figma plan.

It makes no network requests and collects no data.

Some notes are marked "Atlas guidance, beyond WCAG": advice from the APG or from practice that
no WCAG success criterion requires.

The requirements, their reasons and their sources are the ones published at
https://earshot-atlas.vercel.app, where each pattern also has its behaviour rules and a working
reference. Found something wrong? The site has a way to suggest a correction.

## Category

"Accessibility" if the form offers it; the list of categories was not read. Otherwise the
closest one for design tools, and say which was chosen.

## Support contact

If the form takes a link: the site's public repository, where corrections already go,
https://github.com/kostya-gromov/earshot-atlas/issues. If it takes only an email address, the
owner types his own in the form; it is not kept in this file.

## Network access shown on the listing

None. The manifest declares `networkAccess: { allowedDomains: ["none"] }`.

## Data security form

Optional, and its review "may take up to two weeks" (same article). Skipped for the first
version: the plugin handles no user data.

## For the version with Figma annotations (not published)

To add to the description when the box "Also add Figma annotations" is released, after the
paragraph on what the plugin does not do:

> New: tick "Also add Figma annotations" to get each requirement as a Figma annotation on its
> layer too, for Dev Mode. This needs a Full seat on a paid plan; without one the plugin says so
> and adds the notes as layers only.

If it is released before anyone has run it on a Full seat, add: "This part has not been tried on
a paid seat yet; tell us what you see."
