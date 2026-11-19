import { describe, expect, it } from 'vitest';
import { Targets } from '../src/index.ts';

const measured = {
  system: 'Atlassian',
  status: 'measured',
  adapter: 'atlassian',
  url: 'https://atlaskit.atlassian.com/example',
  'version-source': 'main bundle',
  checked: '2026-11-06',
};

const issues = (value: unknown) =>
  Targets.safeParse(value).error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('Targets', () => {
  it('accepts measured, planned and not-applicable entries per pattern', () => {
    expect(
      issues({
        'input-with-chips': [
          { ...measured, deprecated: 'https://primer.style/accessibility/' },
          { system: 'React Aria', status: 'planned', url: 'https://react-aria.adobe.com/' },
          {
            system: 'IBM Carbon',
            status: 'not-applicable',
            reason: 'No per-value chips.',
            evidence: 'https://carbondesignsystem.com/components/dropdown/usage/',
            checked: '2026-11-06',
          },
        ],
      }),
    ).toEqual([]);
  });

  it('requires a measured target to name its adapter', () => {
    const { adapter: _, ...withoutAdapter } = measured;
    expect(issues({ 'input-with-chips': [withoutAdapter] })).toEqual([
      'input-with-chips.0.adapter',
    ]);
  });

  it('requires evidence for a system with no equivalent component', () => {
    expect(
      issues({
        'input-with-chips': [
          { system: 'GOV.UK', status: 'not-applicable', reason: 'None.', checked: '2026-11-06' },
        ],
      }),
    ).toEqual(['input-with-chips.0.evidence']);
  });

  it('rejects unknown fields, so a typo cannot hide a note', () => {
    expect(issues({ 'input-with-chips': [{ ...measured, deprecatd: 'x' }] })).toEqual([
      'input-with-chips.0',
    ]);
  });
});
