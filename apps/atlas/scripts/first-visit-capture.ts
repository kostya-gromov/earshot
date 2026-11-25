/// <reference types="node" />
/*
 * What the first-visit-reviewer agent reads (.claude/agents/first-visit-reviewer.md): each page
 * as a newcomer meets it, first screen and whole page at 1440 and 390 px, and its visible text
 * with its links. The agent sees only this folder, never the repository, so its reading is not
 * shaped by what the pages were meant to say.
 *
 * Run after `pnpm build:atlas`, with the export served:
 *   node ../../packages/reference/scripts/serve.ts --port 4230 --root out --home / &
 *   node scripts/first-visit-capture.ts http://localhost:4230 <out-dir> / /patterns/select/
 *
 * A path may end in a rule's anchor (/patterns/dialog/#rule-modal): the page opens on that rule's
 * panel, so the reader can follow a headline claim to its evidence (first-visit review,
 * 2026-11-25: the panels behind the claims were not in the capture).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from '@playwright/test';

const [base = 'http://localhost:4230', outDir = 'first-visit', ...paths] = process.argv.slice(2);
const pages = paths.length > 0 ? paths : ['/'];
const views = [
  { width: 1440, height: 900, deviceScaleFactor: 1 },
  { width: 390, height: 844, deviceScaleFactor: 2 },
] as const;
/** Long enough for the opening's one load sequence (≤ 1.3 s) and a first replay to settle. */
const settleMs = 2500;

/** "home", "patterns-select": a file name a reader can match to the page. */
const nameOf = (path: string) =>
  path
    .replace(/^\/|\/$/g, '')
    .replace(/\/?#/, '-')
    .replaceAll('/', '-') || 'home';

/** The page's words in reading order, then every link with where it goes. */
function readPage(origin: string): string {
  const text = document.querySelector('main')?.innerText ?? document.body.innerText;
  const links = [...document.querySelectorAll('a[href]')].map((link) => {
    const href = (link as HTMLAnchorElement).href;
    const leaves = new URL(href).origin !== origin;
    const words = (link.textContent ?? '').replace(/\s+/g, ' ').trim();
    return `- ${words || '(no text)'} → ${href}${leaves ? '  [leaves the site]' : ''}`;
  });
  return `${text}\n\n# Links\n${links.join('\n')}\n`;
}

/**
 * The whole page in pieces two screens tall, `-full-1.png`, `-full-2.png`…: one image of a long
 * page is scaled down until its small type cannot be read (first run, 2026-11-25).
 */
async function capturePieces(page: Page, prefix: string, screen: number): Promise<void> {
  // Drawings and meters arrive when first scrolled to (apps/atlas/CLAUDE.md, Arrival): without
  // a scroll through the page they were captured empty (2026-11-25).
  for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += screen / 2) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const width = page.viewportSize()?.width ?? 1440;
  const piece = screen * 2;
  for (let top = 0, index = 1; top < total; top += piece, index += 1) {
    const clip = { x: 0, y: top, width, height: Math.min(piece, total - top) };
    await page.screenshot({
      path: join(outDir, `${prefix}-full-${index}.png`),
      fullPage: true,
      clip,
    });
  }
}

async function capture(browser: Browser, path: string): Promise<void> {
  const name = nameOf(path);
  for (const view of views) {
    const { width, height, deviceScaleFactor } = view;
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor,
      colorScheme: 'dark',
    });
    await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(settleMs);
    await page.screenshot({ path: join(outDir, `${name}-${view.width}-first-screen.png`) });
    await capturePieces(page, `${name}-${view.width}`, view.height);
    if (view.width === 1440) {
      writeFileSync(
        join(outDir, `${name}.txt`),
        await page.evaluate(readPage, new URL(base).origin),
      );
    }
    await page.close();
  }
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const path of pages) await capture(browser, path);
await browser.close();
console.log(`Captured ${pages.length} page(s) into ${outDir}`);
