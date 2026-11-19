import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { Targets, type TargetEntry } from '@earshot/contracts';

const targetsFile = path.join(process.cwd(), '..', '..', 'data', 'targets.yaml');

/** Every candidate system for a pattern from data/targets.yaml, parsed with the shared schema. */
export async function loadTargets(patternId: string): Promise<readonly TargetEntry[]> {
  const result = Targets.safeParse(parse(await readFile(targetsFile, 'utf8')));
  if (!result.success) throw new Error(`data/targets.yaml is invalid:\n${result.error.message}`);
  return result.data[patternId] ?? [];
}
