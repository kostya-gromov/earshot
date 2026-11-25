/**
 * Dated snapshots of the APG and WCAG pages our rules cite, and a check that they still hold.
 *
 *   pnpm sources:snapshot   fetch every cited page, write docs/sources/<page>.md
 *   pnpm sources:check      fail if a page is gone, a cited fragment is missing, or the page
 *                           changed since its snapshot (a person re-reads the rule, then snapshots)
 *
 * Network only here, never in `pnpm check`: CI must not fail because w3.org is slow.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { patterns, patternsInProgress } from '../../src/index.ts';
import { collectSources, type CitedSource } from './collect-sources.ts';
import { pageIds, pageText, textHash } from './page-text.ts';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const snapshotDir = join(repoRoot, 'docs', 'sources');
/** One request at a time with a pause: a polite client of a public site (CLAUDE.md conduct). */
const PAUSE_MS = 1000;

const fileName = (page: string) =>
  `${page
    .replace('https://www.w3.org/WAI/', '')
    // A page outside the W3C (MDN, a browser's blog, 2026-11-25): its host, not its protocol.
    .replace(/^https?:\/\//, '')
    .replace(/\.html$|\/$/g, '')
    .replace(/[/#]+/g, '--')}.md`;

async function fetchPage(
  url: string,
): Promise<{ ok: true; html: string } | { ok: false; reason: string }> {
  const response = await fetch(url, { headers: { 'user-agent': 'earshot-sources-check' } });
  if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` };
  return { ok: true, html: await response.text() };
}

function render(source: CitedSource, text: string, today: string): string {
  return [
    '---',
    `url: ${source.page}`,
    `title: ${JSON.stringify(source.title)}`,
    `fetched: ${today}`,
    `hash: ${textHash(text)}`,
    `cited-by: ${JSON.stringify(source.citedBy)}`,
    '---',
    '',
    text,
    '',
  ].join('\n');
}

const storedHash = async (path: string) =>
  /^hash: (\w+)$/m.exec(await readFile(path, 'utf8').catch(() => ''))?.[1];

async function visit(source: CitedSource, mode: string, today: string): Promise<string[]> {
  const page = await fetchPage(source.page);
  if (!page.ok) return [`${source.page}: ${page.reason}`];
  const ids = pageIds(page.html);
  const problems = source.fragments
    .filter((fragment) => !ids.has(fragment))
    .map((fragment) => `${source.page}#${fragment}: fragment not on the page`);
  const text = pageText(page.html);
  const path = join(snapshotDir, fileName(source.page));
  if (mode === 'snapshot') {
    await writeFile(path, render(source, text, today));
    return problems;
  }
  const hash = await storedHash(path);
  if (!hash) return [...problems, `${source.page}: no snapshot, run pnpm sources:snapshot`];
  if (hash !== textHash(text)) {
    return [...problems, `${source.page}: changed since its snapshot; re-read the rules citing it`];
  }
  return problems;
}

const mode = process.argv[2] === 'snapshot' ? 'snapshot' : 'check';
const today = new Date().toISOString().slice(0, 10);
const sources = collectSources([...Object.values(patterns), ...Object.values(patternsInProgress)]);
await mkdir(snapshotDir, { recursive: true });
const problems: string[] = [];
for (const source of sources) {
  problems.push(...(await visit(source, mode, today)));
  await sleep(PAUSE_MS);
}
console.log(`${mode}: ${sources.length} cited page(s), ${problems.length} problem(s).`);
for (const problem of problems) console.error(`  ${problem}`);
if (problems.length > 0) process.exitCode = 1;
