/*
 * Figma's plugin sandbox runs one script and has no modules. The drawing code is written as
 * ordinary modules so that it is typed and linted like the rest; this joins them into that one
 * script. It relies on what the repository already enforces: named exports only, and no two
 * modules of the drawing giving the same name to different things.
 */

/** Modules, already without types and in dependency order, as one script with one scope. */
export function joinModules(sources: readonly string[]): string {
  return sources
    .map((source) => source.replace(/^import [^;]*;\n?/gm, '').replace(/^export /gm, ''))
    .join('\n');
}
