# 0001. Site framework: Next.js (App Router, static export) with React

- Status: accepted (2026-10-31; revisit if the trade-offs below turn out wrong)
- Replaces: "Astro with Vue islands" in CLAUDE.md section 7

## Context

Atlas must look and feel top tier (Linear level), with motion that explains behavior: focus travelling between elements, chips leaving, keycaps reacting to real key presses. It must also stay static, fast (Lighthouse ≥ 95) and exemplary for accessibility. React is preferred over Vue for this project. The future paid product (PR review app) will be a real application, not a content site.

## Options

1. **Next.js App Router with `output: 'export'`.** React Server Components render content at build time. Client components are used only for interactive parts.
2. **Astro with React islands.** Zero JS by default, React loaded only where islands exist.
3. **Vite + React SPA.** Rejected: core content would need client rendering, which breaks the static, no-client-fetch requirement.

## Decision

Option 1, Next.js.

- **One stack for Atlas and the future Earshot app.** Shared components, tokens and motion primitives carry over without a rewrite.
- **Motion quality.** `motion/react` (layout animations, `AnimatePresence`, springs) and React's `<ViewTransition>` are the strongest tools for the focus-travel and chip-leave effects.
- **RSC keeps content server-only.** Rules, sources, evidence text and code blocks ship as HTML, so the JS budget goes to the playground, the command palette and the replays.
- **`next/font`** self-hosts fonts with metric-matched fallbacks, giving CLS 0 without manual work.

## Consequences

- The baseline JS is higher than Astro's (React + Next runtime on every page). The budget is measured as JS **beyond the framework baseline**, and Lighthouse ≥ 95 is enforced in CI. If the pattern page cannot reach 95, we revisit option 2. Components are plain React, so moving is cheap.
- **Static export only.** No API routes, middleware, ISR or server actions in phase 1. This also enforces "no backend calls to third-party URLs".
- **Framework-free reference implementation stays framework-free.** A client component mounts `chip-field.ts` (types removed, see ADR 0002) into a DOM node that React never renders into (a `ref`, no children), so the code shown equals the code running.
- **No component library.** Tabs, disclosure and the command palette (an APG combobox) are hand-built, because the product is about exactly this behavior. CSS stays vanilla: global token layer plus CSS Modules. No Tailwind.
