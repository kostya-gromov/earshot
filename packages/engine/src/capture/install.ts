import { readFile } from 'node:fs/promises';
import type { BrowserContext } from '@playwright/test';
import { toBrowserJs } from '@earshot/reference/to-browser-js';

/**
 * In-page scripts, in install order: shadow-roots creates window.__earshot, the others
 * extend it. Installed on the context, so they run in every page and frame before any
 * page script.
 */
const PAGE_SCRIPTS = [
  'shadow-roots.ts',
  'deep-focus.ts',
  'held-nodes.ts',
  'live-region-recorder.ts',
  'quiet-tracker.ts',
];

export async function installPageScripts(context: BrowserContext): Promise<void> {
  for (const file of PAGE_SCRIPTS) {
    const source = await readFile(new URL(`./page/${file}`, import.meta.url), 'utf8');
    await context.addInitScript({ content: toBrowserJs(source, file) });
  }
}
