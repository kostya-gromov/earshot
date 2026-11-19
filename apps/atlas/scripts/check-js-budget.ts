/// <reference types="node" />
/*
 * Client JS budget (apps/atlas/CLAUDE.md): at most 60 KB gzip beyond the framework baseline on the
 * pattern page, for every pattern. The baseline is what the export's near-empty 404 page loads;
 * everything else a pattern page references, plus the reference implementation it imports, counts.
 * Run after `pnpm build`: node scripts/check-js-budget.ts
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const out = join(import.meta.dirname, '..', 'out');
const budgetBytes = 60 * 1024;

const chunksOf = (html: string): Set<string> =>
  new Set(html.match(/\/_next\/static\/chunks\/[\w.-]+\.js/g) ?? []);
const gzipped = (file: string): number => gzipSync(readFileSync(file)).length;
const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

const baseline = chunksOf(readFileSync(join(out, '404.html'), 'utf8'));

/** What one pattern's page loads beyond the baseline: its chunks and its reference's modules. */
function rowsOf(pattern: string) {
  const html = readFileSync(join(out, 'patterns', pattern, 'index.html'), 'utf8');
  const chunks = [...chunksOf(html)].filter((chunk) => !baseline.has(chunk));
  const referenceDir = join(out, 'reference', pattern);
  const modules = readdirSync(referenceDir).filter((name) => name.endsWith('.js'));
  return [
    ...chunks.map((chunk) => ({ name: chunk, bytes: gzipped(join(out, chunk)) })),
    ...modules.map((name) => ({
      name: `/reference/${pattern}/${name}`,
      bytes: gzipped(join(referenceDir, name)),
    })),
  ];
}

// Every pattern that has a page is held to the budget, not only the first one.
for (const pattern of readdirSync(join(out, 'patterns'))) {
  const rows = rowsOf(pattern);
  const total = rows.reduce((sum, { bytes }) => sum + bytes, 0);
  console.log(`\n/patterns/${pattern}/`);
  for (const { name, bytes } of rows) console.log(`${kb(bytes).padStart(9)}  ${name}`);
  console.log(
    `${kb(total).padStart(9)}  total beyond the framework baseline (budget ${kb(budgetBytes)})`,
  );
  if (total > budgetBytes) {
    console.error(`Over budget by ${kb(total - budgetBytes)}.`);
    process.exitCode = 1;
  }
}
