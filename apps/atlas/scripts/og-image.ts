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
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:4210/';
const out = join(import.meta.dirname, '..', 'src', 'app', 'opengraph-image.png');

/** Hides everything on the page but the brand, the question and the line under it. */
function keepOpening(): void {
  const heading = document.querySelector('main h1');
  // The largest block around an element that does not hold the question: the whole of it goes.
  const blockOf = (element: Element): Element => {
    let block = element;
    while (block.parentElement && heading && !block.parentElement.contains(heading)) {
      block = block.parentElement;
    }
    return block;
  };
  const remove = (element: Element | null | undefined) => {
    if (element instanceof HTMLElement) element.style.display = 'none';
  };
  document.querySelector('header')?.querySelectorAll('nav, button').forEach(remove);
  remove(document.querySelector('body footer'));
  const label = [...document.querySelectorAll('main *')]
    .filter((element) => element.textContent?.trim().startsWith('These fields look the same.'))
    .at(-1);
  if (label) remove(blockOf(label));
  document.querySelectorAll('main a').forEach((link) => remove(link));
  // The sections after the opening, which a 630 px picture would cut through.
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
await page.evaluate(keepOpening);
await page.screenshot({ path: out });
await browser.close();
console.log(`Wrote ${out}`);
