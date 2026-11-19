import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { Measurement, inputWithChips } from '@earshot/contracts';
import { writeMeasurement } from '../../src/cli/write-measurement.ts';

const measurement = Measurement.parse({
  schemaVersion: 1,
  pattern: 'input-with-chips',
  target: {
    system: 'Reference',
    systemVersion: { version: '0.1.0', source: 'package.json' },
    url: 'http://localhost:4173/input-with-chips/',
    adapter: 'reference',
    adapterVersion: 1,
  },
  provenance: {
    status: 'measured',
    engineVersion: '0.1.0',
    browser: 'chromium 140',
    os: 'darwin',
    measuredAt: '2026-11-01T12:00:00.000Z',
    runs: 1,
    consistent: false,
  },
  scenarios: [
    {
      id: 'tab-out',
      rules: ['chip-stop', 'chip-arrows', 'tab', 'arrows', 'bsp', 'keep-focus', 'say', 'count'],
      initialState: 'Initial state was not reached',
      runs: [{ status: 'setup-failed', reason: 'Fixture' }],
    },
  ],
  verdicts: Object.fromEntries(
    ['chip-stop', 'chip-arrows', 'tab', 'arrows', 'bsp', 'keep-focus', 'say', 'count'].map((id) => [
      id,
      { verdict: 'inconclusive', summary: 'Fixture', reason: 'Fixture' },
    ]),
  ),
});

it('writes a formatted, schema-valid measurement and creates parent folders', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'earshot-measurement-'));
  const file = join(directory, 'nested', 'reference.json');
  try {
    await writeMeasurement(measurement, inputWithChips, file);

    const text = await readFile(file, 'utf8');
    expect(text.endsWith('\n')).toBe(true);
    expect(Measurement.parse(JSON.parse(text))).toEqual(measurement);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('rejects a schema-valid measurement missing a pattern verdict', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'earshot-measurement-'));
  const file = join(directory, 'reference.json');
  const partial = {
    ...measurement,
    verdicts: { tab: measurement.verdicts.tab! },
    scenarios: [{ ...measurement.scenarios[0]!, rules: ['tab'] }],
  };
  try {
    await expect(writeMeasurement(partial, inputWithChips, file)).rejects.toThrow(
      'missing verdict for rule "bsp"',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
