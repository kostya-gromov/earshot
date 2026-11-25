/// <reference types="node" />
/*
 * The link preview image (src/app/opengraph-image.png), taken from the built home page so it
 * looks like the site. Only what does not go stale is kept: the mark, the question and the
 * line under it. The example scene is left out because it shows measured values, and a picture
 * shared in a chat would keep them past the next measurement, without their provenance.
 *
 * Run after `pnpm build:atlas`, with the export served:
 *   node ../../packages/reference/scripts/serve.ts --port 4210 --root out --home / &
 *   node scripts/og-image.ts http://localhost:4210/
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { openingText } from './og-opening.ts';

const url = process.argv[2] ?? 'http://localhost:4210/';
const app = join(import.meta.dirname, '..', 'src', 'app');
const out = join(app, 'opengraph-image.png');
// The words the image shows, as its alt text; test/link-preview.spec.ts holds the page to them.
const altOut = join(app, 'opengraph-image.alt.txt');

/**
 * Hides everything on the page but the brand and the opening's three lines: the question, the
 * statement and the line under it (the block around the heading). The scene, the ways in and
 * the sections after it are left out: a 630 px picture would cut through them.
 */
function keepOpening(): void {
  const heading = document.querySelector('main h1');
  const statement = heading?.parentElement;
  const remove = (element: Element | null | undefined) => {
    if (element instanceof HTMLElement) element.style.display = 'none';
  };
  document.querySelector('header')?.querySelectorAll('nav, button').forEach(remove);
  remove(document.querySelector('body footer'));
  // Every sibling of the statement in the opening, and every section after the opening.
  [...(statement?.parentElement?.children ?? [])]
    .filter((block) => block !== statement)
    .forEach(remove);
  [...(document.querySelector('main')?.children ?? [])]
    .filter((section) => heading && !section.contains(heading))
    .forEach(remove);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  colorScheme: 'dark',
  reducedMotion: 'reduce',
});
await page.goto(url);
await page.evaluate(() => document.fonts.ready);
const alt = await page.evaluate(openingText);
await page.evaluate(keepOpening);
await page.screenshot({ path: out });
await browser.close();
// No newline at the end: Next puts the file into the attribute as it is.
writeFileSync(altOut, alt);
console.log(`Wrote ${out} and ${altOut}`);
