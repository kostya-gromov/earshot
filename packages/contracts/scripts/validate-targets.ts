/**
 * data/targets.yaml must parse with the Targets schema and agree with data/measurements: every
 * measurement file has a measured entry, and every measured entry has a file. Recorded notes and
 * variants are checked in validate-observations.ts.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { Targets } from '../src/index.ts';
import { validateObservations } from './validate-observations.ts';

async function measuredFiles(measurementsDir: string, patternId: string): Promise<string[]> {
  try {
    const names = await readdir(join(measurementsDir, patternId));
    return names.filter((name) => name.endsWith('.json')).map((name) => name.slice(0, -5));
  } catch {
    return [];
  }
}

export async function validateTargets(repoRoot: string): Promise<string[]> {
  const parsed = Targets.safeParse(
    parse(await readFile(join(repoRoot, 'data', 'targets.yaml'), 'utf8')),
  );
  if (!parsed.success) {
    return parsed.error.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
  }
  const problems: string[] = [];
  const measurementsDir = join(repoRoot, 'data', 'measurements');
  for (const [patternId, entries] of Object.entries(parsed.data)) {
    const adapters = entries.flatMap((entry) =>
      entry.status === 'measured' ? [entry.adapter] : [],
    );
    const files = await measuredFiles(measurementsDir, patternId);
    for (const file of files.filter((name) => !adapters.includes(name))) {
      problems.push(`${patternId}: ${file}.json has no measured entry`);
    }
    for (const adapter of adapters.filter((name) => !files.includes(name))) {
      problems.push(`${patternId}: measured entry "${adapter}" has no measurement file`);
    }
  }
  return [...problems, ...(await validateObservations(measurementsDir, parsed.data))];
}
