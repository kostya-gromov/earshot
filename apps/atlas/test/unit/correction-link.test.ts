import { describe, expect, it } from 'vitest';
import type { Measurement } from '@earshot/contracts';
import { correctionLink, publicRepository } from '../../src/lib/correction-link';

// Only the fields the link reads.
const measurement = (overrides: Partial<Record<'version' | 'reason', string>> = {}) =>
  ({
    pattern: 'combobox',
    target: {
      system: 'MUI',
      systemVersion: overrides.reason
        ? { reason: overrides.reason }
        : { version: overrides.version ?? '9.5.0' },
    },
    provenance: { status: 'measured', measuredAt: '2026-11-17T13:03:32.586Z' },
    verdicts: { escape: { verdict: 'differs' } },
  }) as unknown as Measurement;

const paramsOf = (link: string) => new URL(link).searchParams;

describe('correctionLink', () => {
  it('opens the correction form on the public repository', () => {
    const link = correctionLink({ measurement: measurement(), file: 'x.json', ruleId: 'escape' });
    expect(link.startsWith(`${publicRepository}/issues/new?`)).toBe(true);
    expect(paramsOf(link).get('template')).toBe('correction.yml');
  });

  it('names the system, version and rule in the title, which is enough on its own', () => {
    const link = correctionLink({ measurement: measurement(), file: 'x.json', ruleId: 'escape' });
    expect(paramsOf(link).get('title')).toBe('Correction: MUI 9.5.0, combobox / escape');
  });

  it('fills the verdict, the date measured and the raw file on GitHub', () => {
    const params = paramsOf(
      correctionLink({
        measurement: measurement(),
        file: 'data/measurements/combobox/mui.json',
        ruleId: 'escape',
      }),
    );
    expect(params.get('verdict')).toBe('differs');
    expect(params.get('measured')).toBe('2026-11-17');
    expect(params.get('file')).toBe(
      `${publicRepository}/blob/main/data/measurements/combobox/mui.json`,
    );
  });

  it('says so when the version is unknown or the rule has no verdict', () => {
    const params = paramsOf(
      correctionLink({
        measurement: measurement({ reason: 'no package' }),
        file: 'x',
        ruleId: 'tab',
      }),
    );
    expect(params.get('system')).toBe('MUI version unknown');
    expect(params.get('verdict')).toBe('no verdict');
  });
});
