import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateObservations } from '../scripts/validate-observations.ts';
import { Targets, measurementOf, variantEntries, type TargetEntry } from '../src/index.ts';

const day = '2026-11-16';
const recorded = (extra: object = {}) => ({
  source: 'recorded',
  date: day,
  text: 'A fact.',
  ...extra,
});
const system = (extra: object = {}) => ({
  system: 'Fluent 2',
  status: 'measured',
  adapter: 'fluent',
  url: 'packages/harness/fluent/menu-button.html',
  ...extra,
});
const variant = (extra: object = {}) =>
  system({
    adapter: 'fluent-plain',
    'variant-of': 'fluent',
    'not-counted': 'a second way',
    ...extra,
  });

const parse = (entries: readonly object[]): readonly TargetEntry[] =>
  Targets.parse({ 'menu-button': entries })['menu-button'] ?? [];

/** A folder of measurement files that hold only what the check reads: the day of the measurement. */
async function measured(files: Readonly<Record<string, string>>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'earshot-observations-'));
  await mkdir(join(root, 'menu-button'));
  for (const [adapter, measuredAt] of Object.entries(files)) {
    const file = join(root, 'menu-button', `${adapter}.json`);
    await writeFile(file, JSON.stringify({ provenance: { measuredAt } }));
  }
  return root;
}

const check = async (entries: readonly object[], files: Readonly<Record<string, string>>) =>
  validateObservations(await measured(files), { 'menu-button': parse(entries) });

describe('a recorded observation', () => {
  it('names a measurement only when it was recorded', () => {
    const seen = { source: 'seen', date: day, text: 'A fact.', measurement: 'fluent' };
    const result = Targets.safeParse({ 'menu-button': [system({ observations: [seen] })] });
    expect(result.error?.issues.map(({ path }) => path.join('.'))).toEqual([
      'menu-button.0.observations.0.measurement',
    ]);
  });

  it('is read from the system’s own measurement unless it names another', () => {
    const [entry] = parse([
      system({ observations: [recorded(), recorded({ measurement: 'fluent-plain' })] }),
    ]);
    if (entry?.status !== 'measured') throw new Error('expected a measured entry');
    expect(entry.observations?.map((note) => measurementOf(entry, note))).toEqual([
      'fluent',
      'fluent-plain',
    ]);
  });

  it('passes when its file was measured on the day the note says', async () => {
    const entries = [system({ observations: [recorded()] })];
    expect(await check(entries, { fluent: `${day}T10:55:16.000Z` })).toEqual([]);
  });

  it('is rejected when its file was measured on another day', async () => {
    const entries = [system({ observations: [recorded()] })];
    expect(await check(entries, { fluent: '2026-11-15T09:00:00.000Z' })).toEqual([
      'menu-button: Fluent 2, recorded note of 2026-11-16 cites fluent.json, which was measured on 2026-11-15',
    ]);
  });

  it('is rejected when the file it cites is not there', async () => {
    const entries = [system({ observations: [recorded()] })];
    expect(await check(entries, {})).toEqual([
      'menu-button: Fluent 2, recorded note of 2026-11-16 cites fluent.json, which cannot be read',
    ]);
  });

  it('may cite a variant of its own system, and no other system', async () => {
    const files = {
      fluent: `${day}T10:00:00Z`,
      'fluent-plain': `${day}T11:00:00Z`,
      mui: `${day}T12:00:00Z`,
    };
    const own = [system({ observations: [recorded({ measurement: 'fluent-plain' })] }), variant()];
    expect(await check(own, files)).toEqual([]);
    const other = [
      system({ observations: [recorded({ measurement: 'mui' })] }),
      system({ system: 'MUI', adapter: 'mui' }),
    ];
    expect(await check(other, files)).toEqual([
      'menu-button: Fluent 2, recorded note of 2026-11-16 cites "mui", which is neither its own nor its variant',
    ]);
  });
});

describe('a variant', () => {
  it('is told apart from the systems that are counted', () => {
    expect(variantEntries(parse([system(), variant()])).map(({ adapter }) => adapter)).toEqual([
      'fluent-plain',
    ]);
  });

  it('must belong to a counted entry and say why it is not counted', async () => {
    const orphan = variant({ 'variant-of': 'nobody', 'not-counted': undefined });
    expect(await check([system(), orphan], {})).toEqual([
      'menu-button: variant "fluent-plain" names "nobody", which is not a counted entry',
      'menu-button: variant "fluent-plain" must say why it is not counted',
    ]);
  });
});

describe('an observation that names the rules it concerns', () => {
  const noted = (rules: readonly string[]) =>
    system({ observations: [{ source: 'seen', date: day, text: 'A fact.', rules }] });

  it('passes when every rule is a rule of the pattern', async () => {
    expect(await check([noted(['tab', 'expanded'])], {})).toEqual([]);
  });

  it('is rejected when it names a rule the pattern does not have', async () => {
    expect(await check([noted(['tab', 'say-count'])], {})).toEqual([
      'menu-button: Fluent 2, note of 2026-11-16 names the rule "say-count", which the pattern does not have',
    ]);
  });

  it('must name at least one rule when it names any', () => {
    const result = Targets.safeParse({ 'menu-button': [noted([])] });
    expect(result.success).toBe(false);
  });
});
