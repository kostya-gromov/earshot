# 0002. Monorepo tooling: TypeScript run directly by Node, no build step for internal packages

- Status: accepted (2026-10-31)

## Context

M0 needs a pnpm monorepo where `contracts`, `reference` and later `engine` and `apps/atlas` share types and data. Every build step is something to configure, cache, and get out of sync. Node 24 runs TypeScript files directly by stripping types (`process.features.typescript === 'strip'`).

## Decision

1. **Internal packages ship their TypeScript source.** `exports` points at `src/*.ts`. Scripts and the future engine CLI run as `node file.ts`, with no tsx and no build. Next.js consumes the packages through `transpilePackages` (M3).
2. **Only erasable TypeScript.** `erasableSyntaxOnly` forbids enums, namespaces and parameter properties, because type stripping cannot remove them. Relative imports keep the `.ts` extension (`allowImportingTsExtensions`, `noEmit`).
3. **Typecheck per package** with `tsc --noEmit` through `pnpm -r typecheck`. No project references yet: they would require `composite` and emitted declaration files for two packages.
4. **TypeScript 6.0, not 7.0.** TypeScript 7 (the native compiler) is current, but typescript-eslint 8.72 supports `<6.1`. Move once typescript-eslint supports 7.
5. **No `yaml` dependency yet.** `data/targets.yaml` arrives in M2; the dependency is requested then.
6. **ADR numbering is chronological.** 0001 site framework, 0002 this, 0003 engine capture.
7. **Browser code is TypeScript too** (amended 2026-10-31). Reference implementations, and later the engine's init scripts, are erasable TypeScript, so they get the same strict typecheck and type-aware lint as everything else. Browsers cannot run TypeScript, so `toBrowserJs` (`packages/reference/scripts/to-browser-js.ts`) removes the types with `typescript.transpileModule` and rewrites `.ts` imports to `.js`. The dev server, the engine and the site's "Copy as JavaScript" all use this one function. Node's built-in `module.stripTypeScriptTypes` was considered; it is still experimental in Node 24 and prints a warning.

## Consequences

- Fast feedback: no watch processes, no stale `dist/`.
- Authors must use `.ts` import extensions and avoid enums. Lint and typecheck enforce both.
- If a package is ever published to npm, it needs a build then. None is planned.
