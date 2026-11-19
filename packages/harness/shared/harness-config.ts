import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

interface HarnessOptions {
  /** The harness package directory (import.meta.url of its vite.config.ts). */
  from: string;
  system: string;
  /** The package whose version the page reports, read from what is installed. */
  measuredPackage: string;
  /**
   * The system's pages, one per pattern, as HTML files beside vite.config.ts. Default: index.html
   * alone (input with chips). Each is built into dist/<system>/ under its own name.
   */
  pages?: readonly string[];
  /**
   * Pages that measure another package of the same system than `measuredPackage` (Atlassian's
   * menu is @atlaskit/dropdown-menu, its other pages @atlaskit/select): page file → package.
   */
  packageByPage?: Readonly<Record<string, string>>;
}

/**
 * The installed version, from the package's own manifest. Some packages do not export
 * package.json, so start at the resolved entry and walk up to the manifest with that name.
 */
function installedVersion(from: string, name: string): string {
  let dir = dirname(createRequire(from).resolve(name));
  while (dir !== dirname(dir)) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      const json = JSON.parse(readFileSync(manifest, 'utf8')) as { name?: string; version: string };
      if (json.name === name) return json.version;
    }
    dir = dirname(dir);
  }
  throw new Error(`No package.json for ${name} above its entry point.`);
}

/**
 * Shared build settings for every harness page (ADR 0005): relative asset paths so the engine's
 * static server can serve dist/<system>/, and a meta tag with the installed package's version.
 */
export function harnessConfig({
  from,
  system,
  measuredPackage,
  pages = ['index.html'],
  packageByPage = {},
}: HarnessOptions) {
  // The page a file path belongs to decides which package's version its meta tag carries.
  const packageOf = (path: string): string => {
    const page = pages.find((name) => path.endsWith(`/${name}`));
    return (page && packageByPage[page]) ?? measuredPackage;
  };
  return {
    base: './',
    build: {
      outDir: fileURLToPath(new URL(`../dist/${system}/`, from)),
      emptyOutDir: true,
      rollupOptions: { input: pages.map((page) => fileURLToPath(new URL(page, from))) },
    },
    plugin: {
      name: 'earshot-version',
      transformIndexHtml: (html: string, context: { path: string }) => {
        const name = packageOf(context.path);
        const version = installedVersion(from, name);
        return html.replace(
          '</head>',
          `  <meta name="earshot-package" content="${name}" data-version="${version}" />\n  </head>`,
        );
      },
    },
  };
}
