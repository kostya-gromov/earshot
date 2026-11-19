import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  Measurement,
  checkMeasurementAgainstPattern,
  variantEntries,
  type Pattern,
} from '@earshot/contracts';
import { isReference } from '@/lib/agreement';
import { loadTargets } from './targets';

/** Build-time only: the site reads data/ from the repository and never fetches it in the browser. */
const measurementsRoot = path.join(process.cwd(), '..', '..', 'data', 'measurements');

export interface LoadedMeasurement {
  measurement: Measurement;
  /** Repository path of the raw JSON, shown as "Raw JSON" on every card. */
  file: string;
  /**
   * Measurements of other ways to build the pattern in this system (data/targets.yaml,
   * `variant-of`). Evidence beside the system, never a column and never counted.
   */
  variants?: readonly LoadedMeasurement[];
}

async function parseFile(file: string, pattern: Pattern): Promise<LoadedMeasurement> {
  const raw: unknown = JSON.parse(await readFile(file, 'utf8'));
  const result = Measurement.safeParse(raw);
  // A build with invalid data must fail (apps/atlas/CLAUDE.md), loudly and with the file named.
  if (!result.success) throw new Error(`${file} is invalid:\n${result.error.message}`);
  const problems = checkMeasurementAgainstPattern(result.data, pattern);
  if (problems.length > 0)
    throw new Error(`${file} does not match ${pattern.id}:\n${problems.join('\n')}`);
  return {
    measurement: result.data,
    file: path.relative(path.join(measurementsRoot, '..', '..'), file),
  };
}

/** Every measurement file of a pattern, variants included: what the "Raw JSON" links serve. */
export async function loadMeasurementFiles(pattern: Pattern): Promise<LoadedMeasurement[]> {
  const folder = path.join(measurementsRoot, pattern.id);
  const files = (await readdir(folder)).filter((name) => name.endsWith('.json'));
  return Promise.all(files.map((name) => parseFile(path.join(folder, name), pattern)));
}

/**
 * Every measured system of a pattern, the reference first, then systems by name. A variant is
 * not a system: it is attached to the one it belongs to, so nothing that counts or draws columns
 * ever sees it (ADR 0005, amendment of 2026-11-16).
 */
export async function loadMeasurements(pattern: Pattern): Promise<LoadedMeasurement[]> {
  const [files, targets] = await Promise.all([
    loadMeasurementFiles(pattern),
    loadTargets(pattern.id),
  ]);
  const parentOf = new Map(
    variantEntries(targets).map((entry) => [entry.adapter, entry['variant-of']]),
  );
  const adapterOf = ({ measurement }: LoadedMeasurement) => measurement.target.adapter;
  const loaded = files
    .filter((file) => !parentOf.has(adapterOf(file)))
    .map((file) => {
      const variants = files.filter((other) => parentOf.get(adapterOf(other)) === adapterOf(file));
      return variants.length > 0 ? { ...file, variants } : file;
    });
  return loaded.sort((a, b) => {
    if (isReference(a.measurement) !== isReference(b.measurement)) {
      return isReference(a.measurement) ? -1 : 1;
    }
    return a.measurement.target.system.localeCompare(b.measurement.target.system, 'en');
  });
}
