import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Measurement, checkMeasurementAgainstPattern, type Pattern } from '@earshot/contracts';

export async function writeMeasurement(
  measurement: Measurement,
  pattern: Pattern,
  file: string,
): Promise<void> {
  const parsed = Measurement.parse(measurement);
  const problems = checkMeasurementAgainstPattern(parsed, pattern);
  if (problems.length > 0) throw new Error(problems.join('\n'));
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(parsed, null, 2)}\n`);
}
