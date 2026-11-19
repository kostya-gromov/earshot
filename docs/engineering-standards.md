# Engineering standards

These rules keep Earshot easy to read, change and reuse as it grows. Most are enforced by ESLint (`eslint.config.js`); the rest are checked in review. When a rule gets in the way of clarity, say so in the PR instead of working around it.

## 1. Architecture

### Dependency direction

Dependencies point one way. A lower layer never imports a higher one.

```
apps/atlas  ──►  packages/engine  ──►  packages/contracts
      │                                   ▲
      └───────────────────────────────────┘
packages/reference: imports nothing from the repo (framework-free browser TypeScript, shipped with types removed)
```

- **contracts**: types, zod schemas, pattern content. Pure: no I/O, no Node or browser APIs, only `zod`.
- **engine**: split into a **functional core** and an **imperative shell**.
  - Core (`evaluators/`, `speech/`, `diff/`, `model/`): pure functions over recorded observations. No Playwright, no `node:*`, no clock, no randomness.
  - Shell (`capture/`, `adapters/`, `runner/`, `cli/`): talks to the browser, the file system and the terminal, then hands plain data to the core.
- **apps/atlas**: reads data at build time and renders it. It never measures anything.

### Inside a package: organise by feature, not by kind

Group what changes together. `evaluators/input-with-chips/` beats one `evaluators.ts` with every pattern in it. Avoid folders named `utils`, `helpers`, `common` or `misc`: name a module after what it does (`accessible-name.ts`, `settle.ts`).

Atlas app layout (from M3):

- `app/`: routes only. Thin: load data, compose features, no logic.
- `features/<feature>/`: one folder per product feature (playground, evidence, command-palette), with its components, hooks and model.
- `ui/`: design system primitives (Keycap, Button, Disclosure). No domain knowledge, no imports from `features/`.
- `lib/`: pure, framework-free helpers shared by features.
- `data/`: build-time loaders that parse files with the contracts schemas. Server only.

### Public surface

Each package or feature exposes an `index.ts`. Import from it, not from its internals. Internal files may change freely; the index is the contract.

## 2. Size limits (enforced)

| Limit | Value | Why |
| --- | --- | --- |
| Lines per file (excluding blanks and comments) | 200 | A file you can hold in your head at once |
| Lines per function | 50 | One screen; longer means it does more than one thing |
| Cyclomatic complexity | 10 | Beyond this, tests stop covering the branches |
| Nesting depth | 3 | Use early returns and extracted functions |
| Parameters | 3 | Pass an options object instead |

Tests are exempt from the function length limit (a `describe` block is long by nature) but not from readability.

Hitting a limit is a design signal, not a formatting problem. Split by responsibility, never by cutting a function in half.

## 3. Code style

- **Names say what, not how.** Functions are verbs (`readFocus`), booleans read as questions (`isBody`, `hasPopup`), no abbreviations except well-known ones (`id`, `url`, `ax`).
- **Files are kebab-case**, types and components are PascalCase.
- **Named exports only.** No default exports, except where a framework requires them (Next.js pages, config files).
- **One idea per module.** If its description needs "and", split it.
- **Prefer pure functions and plain data.** Classes only for something with a real lifecycle (a server, a browser session).
- **No hidden state.** No mutable module-level variables; pass dependencies in.
- **Comments explain why.** The code says what it does. A comment repeating the code is noise.
- **Early returns** over nested `if`/`else`.
- **Readable over clever.** If a one-liner needs a second read, write three lines.

## 4. TypeScript

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` stay on.
- **No `any`.** Use `unknown` and narrow it.
- **Model the domain with types:** discriminated unions for states, so illegal states cannot be represented. `switch` over a union must be exhaustive (lint enforces it).
- **Parse, don't validate:** data from outside (files, browser, network) passes a zod schema once, at the boundary. Inside, trust the types.
- **Expected failures are values**, for example `{ ok: false, reason }` (an adapter could not reach the initial state). Throw only for bugs and broken invariants.
- Types are derived from schemas (`z.infer`), never written twice.
- Only erasable syntax (no `enum`, no `namespace`); see ADR 0002.

## 5. Reuse

- **Rule of three:** duplicate once, extract on the third use. A premature abstraction is harder to undo than a duplicate.
- **Extract by meaning, not by shape.** Two functions that look alike but change for different reasons stay separate.
- **Composition over configuration.** Small parts that combine beat one component with ten boolean props.
- Shared code moves *down* the dependency graph (into `contracts` or `lib/`), never sideways between features.

## 6. React (from M3)

- Server components by default. A component becomes a client component only for interaction, and the `'use client'` boundary sits as low in the tree as possible.
- A component does one job: layout, behavior, or presentation. Behavior lives in hooks or plain modules that can be tested without rendering.
- Props are minimal and typed. No boolean prop explosion: use composition or a variant union.
- No component over 150 lines; extract subcomponents and hooks.

## 7. Tests

- Test behavior through the public surface, not internals.
- Pure core: unit tests with fixture data (Object Mother factories in `test/fixtures.ts`). Every evaluator covers follows, differs and inconclusive.
- Shell and UI: Playwright against a real browser.
- A bug fix starts with a failing test.
- Test names state the behavior: `rejects an unknown version without a reason`.

## 8. Pull requests

- Small and focused: one change, one reason.
- The description says what, why, how to verify, and **which principle or pattern is at work** (CLAUDE.md 8).
- `pnpm check` and `pnpm test:e2e` pass.
- New dependency: one-line reason, and approval first (CLAUDE.md 5).
- Hard-to-reverse decisions get an ADR in `docs/decisions/`.
