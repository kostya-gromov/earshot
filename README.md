# Earshot Atlas

A reference for complex UI patterns that answers three questions: how the pattern should behave, what real design systems actually do, and what accessibility asks of the design and the code. The answers come from measurement. An automated engine presses real keys in each system's published component, then records where focus goes, how the accessibility tree changes and what live regions announce. It judges every rule from that record.

Three patterns are measured, each in six design systems: input with chips, combobox (list autocomplete) and menu button. Decisions, proposals and pattern briefs start from [`docs/INDEX.md`](docs/INDEX.md).

**Status:** milestone M5, validation with designers and engineers. A first check by hand of the measured findings, with VoiceOver, is being repeated item by item, and a check with NVDA and Firefox is still due ([`docs/a11y-checks/`](docs/a11y-checks/README.md)).

## Setup

You need Node 24 (see `.nvmrc`) and pnpm (the version is pinned in `package.json`).

```sh
nvm use
corepack enable pnpm
pnpm install
pnpm check          # lint, format, typecheck, unit tests, data validation
```

## Run the site

```sh
pnpm --filter @earshot/atlas dev            # http://localhost:4200, reloads on change
```

The site is a static export. To see exactly what gets deployed:

```sh
pnpm build:atlas
cd apps/atlas && node ../../packages/reference/scripts/serve.ts --port 4202 --root out --home /
```

## Reference implementations

These are framework-free implementations of each pattern. They are measured by the same engine and follow every rule.

```sh
pnpm --filter @earshot/reference dev        # http://localhost:4173/input-with-chips/
```

## Measure

Targets are listed in `data/targets.yaml`. Third-party systems are measured on their published packages, rendered by `packages/harness` (ADR 0005).

```sh
pnpm --filter @earshot/harness build                              # build the systems' pages
pnpm engine run --pattern input-with-chips --target reference --runs 3
pnpm engine run --pattern combobox --all --runs 3
```

Measurement files in `data/measurements/` are written by the engine only, never by hand. Each one carries its provenance: system, version, browser, engine version and date.

## Test

Install the browser once with `pnpm --filter @earshot/reference exec playwright install chromium`.

```sh
pnpm test:e2e                                    # reference and site behavior, axe, in Chromium
pnpm --filter @earshot/atlas test:visual         # visual regression, four modes (after build:atlas)
pnpm check:panel                                 # the rule panel's invariants (builds first)
pnpm --filter @earshot/atlas budget              # client JS per pattern page, 60 KB gzip at most
pnpm sources:check                               # cited WCAG and APG pages against their snapshots (network)
```

Run one build and one browser suite at a time. In parallel, runs time out for no real reason.

## License

The code is under the MIT License ([`LICENSE`](LICENSE)). The measurements and targets in `data/` and the documents in `docs/` are under Creative Commons Attribution 4.0 ([`LICENSE-CC-BY-4.0`](LICENSE-CC-BY-4.0)): use them, with credit to Earshot Atlas and a link to this repository. The design systems that are measured are not part of this repository. The harness installs their published packages, which keep their own licenses.

## Layout

```text
packages/contracts   types, zod schemas, pattern content (rules, sources, requirements, trade-offs)
packages/engine      deterministic core (evaluators, speech model, diff) and shell (capture, adapters, CLI)
packages/reference   framework-free reference implementations and their static server
packages/harness     each measured system's published component, rendered for the engine
apps/atlas           the site (Next.js, static export)
data/                targets.yaml and the measurement files
docs/                ADRs, proposals, pattern briefs, screen reader checks, engineering standards
```
