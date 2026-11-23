/// <reference types="node" />
/*
 * The pictures of the plugin's Community listing, in the sizes Figma's publishing page
 * recommends (icon 128 by 128, thumbnail 1920 by 1080; help.figma.com, article 360042293394):
 *
 *   node scripts/figma-listing.ts
 *
 * The thumbnail shows a real board (figma/listing/board.png, a screenshot of the board the
 * drawing code made in Figma), not a mock-up: take it again when the drawing changes. It shows
 * requirements and no measured value, so nothing in it goes stale with a measurement.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const listing = join(import.meta.dirname, '..', 'figma', 'listing');
const board = readFileSync(join(listing, 'board.png')).toString('base64');

/* The Atlas mark (src/app/icon.svg): the Tab key, its stop in the focus colour. */
const mark = (size: number, radius: number): string => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 20 20" width="${String(size)}" height="${String(size)}">
  <rect x="2" y="2" width="20" height="20" rx="${String(radius)}" fill="oklch(0.96 0.005 265)" />
  <g fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="oklch(0.15 0.012 265)" d="M6.6 12h7M10.7 8.7 14 12l-3.3 3.3" />
    <path stroke="oklch(0.53 0.2 260)" d="M17.3 8v8" />
  </g>
</svg>`;

const base = `* { box-sizing: border-box; margin: 0; }
  body { font-family: Inter, system-ui, sans-serif; background: oklch(0.15 0.012 265); color: oklch(0.96 0.005 265); }`;

/* The icon fills its square: Figma rounds the corners itself. */
const icon = `<style>${base} body { display: grid; }</style>${mark(128, 0)}`;

const thumbnail = `<style>${base}
  body { width: 1920px; height: 1080px; padding: 96px; display: grid; grid-template-columns: 640px 1fr; gap: 96px; align-items: center; }
  .brand { display: flex; align-items: center; gap: 20px; font-size: 34px; font-weight: 600; }
  h1 { margin-top: 56px; font-size: 76px; line-height: 1.06; letter-spacing: -0.035em; font-weight: 600; }
  h1 span { color: oklch(0.62 0.012 265); }
  p { margin-top: 40px; font-size: 30px; line-height: 1.4; color: oklch(0.76 0.012 265); }
  img { width: 100%; border-radius: 16px; display: block; }
</style>
<div>
  <div class="brand">${mark(48, 6)}Earshot Atlas</div>
  <h1>A pattern, drawn <span>with what accessibility asks of its design.</span></h1>
  <p>Input with chips, combobox, menu button, tabs and modal dialog. Each requirement is a numbered note with its WCAG or APG source.</p>
</div>
<img alt="" src="data:image/png;base64,${board}">`;

const browser = await chromium.launch();
for (const [name, html, width, height] of [
  ['icon.png', icon, 128, 128],
  ['thumbnail.png', thumbnail, 1920, 1080],
] as const) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html);
  await page.screenshot({ path: join(listing, name) });
  await page.close();
}
await browser.close();
console.log(`Wrote icon.png and thumbnail.png to ${listing}`);
