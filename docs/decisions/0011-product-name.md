# 0011. The product is called Earshot

- Status: accepted (2026-11-24)
- Scope: everything a reader sees; `CLAUDE.md` 1

## Context

The public reference was called "Earshot Atlas", shown on the site as "Atlas". On 2026-11-24
it was decided to drop "Atlas": the word is used by many products, so it neither stood out nor
could be searched for. "Earshot" was the distinctive half of the name all along.

## Decision

- The public reference is **Earshot**: the site's header and footer, page titles, Open Graph,
  rule and requirement text ("An Earshot recommendation"), docs and agents.
- The paid product that runs the engine on a team's pull requests, out of scope for now, has the
  working name **Earshot for teams**.
- **Internal names stay**: the folder `apps/atlas`, `pnpm build:atlas`, the skills
  `atlas-content` and `atlas-verdict-audit`. A reader never sees them, and renaming them touches
  imports, configs and CI for no reader's gain.
- **Dated records stay as written**: ADRs, proposals, follow-ups, retrospectives, design reviews,
  a11y checks and eval results say "Atlas" where they did at the time.
- **The repositories, renamed the same day**: the public one from `earshot-atlas` to
  `earshot` (GitHub redirects the old address), the private one from `earshot` to
  `earshot-private`, in that order so the name was free.
- **What is outside the repository waits**: the address `earshot-atlas.vercel.app`
  stays, since `earshot.vercel.app` belongs to someone else; a domain of our own would replace it.
  The Figma plugin stays "Earshot Atlas" until Figma's review is over
  (`docs/follow-ups/figma-plugin.md`); its listing links the old repository address, which
  redirects.

## Consequences

The sample text on the tabs pages ("Earshot Atlas" in the field "Project name") changed with the
name, so the reference went to 0.1.9 and every reference and every tabs system was measured
again: no verdict, summary or reason changed.
