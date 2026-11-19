/**
 * Validates every measurement file against the shared schema and its pattern's rules.
 * Run by `pnpm validate` and in CI; any problem exits non-zero so bad data never ships.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Measurement,
  checkMeasurementAgainstPattern,
  patterns,
  patternsInProgress,
} from '../src/index.ts';
import { validateTargets } from './validate-targets.ts';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const measurementsDir = join(repoRoot, 'data', 'measurements');

async function listJson(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => join(e.parentPath, e.name))
    .sort();
}

async function validateFile(file: string): Promise<string[]> {
  let json: unknown;
  try {
    json = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    return [`not valid JSON: ${(error as Error).message}`];
  }

  const parsed = Measurement.safeParse(json);
  if (!parsed.success) {
    return parsed.error.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
  }

  const m = parsed.data;
  // A pattern in progress is measured before it is published; its files are validated too.
  const pattern = patterns[m.pattern] ?? patternsInProgress[m.pattern];
  if (!pattern) return [`pattern: unknown pattern "${m.pattern}"`];

  // data/measurements/<pattern>/<target>.json keeps files findable by pattern.
  const folder = relative(measurementsDir, file).split(sep)[0];
  const problems = checkMeasurementAgainstPattern(m, pattern);
  if (folder !== m.pattern) problems.push(`file is in "${folder}/" but pattern is "${m.pattern}"`);
  return problems;
}

const files = await listJson(measurementsDir);
let failed = 0;

for (const file of files) {
  const problems = await validateFile(file);
  const shown = relative(repoRoot, file);
  if (problems.length === 0) {
    console.log(`ok    ${shown}`);
    continue;
  }
  failed++;
  console.error(`fail  ${shown}`);
  for (const p of problems) console.error(`        ${p}`);
}

const targetProblems = await validateTargets(repoRoot);
if (targetProblems.length === 0) {
  console.log('ok    data/targets.yaml');
} else {
  console.error('fail  data/targets.yaml');
  for (const p of targetProblems) console.error(`        ${p}`);
}

console.log(`\n${files.length} measurement file(s), ${failed} invalid.`);
if (failed > 0 || targetProblems.length > 0) process.exit(1);
