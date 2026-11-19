import { describe, expect, it } from 'vitest';
import { describeShare, judgedShare } from '../../src/lib/verdict-basis';

const entry = (verdict: 'follows' | 'differs' | 'inconclusive') => ({
  scenario: verdict,
  verdict,
  summary: verdict,
});

describe('judgedShare', () => {
  it('names how many scenarios judged a follows that rests on part of the rule', () => {
    const share = judgedShare({
      verdict: 'follows',
      basis: [entry('inconclusive'), entry('inconclusive'), entry('follows')],
    });
    expect(share && describeShare(share)).toBe('Judged on 1 of 3 scenarios');
  });

  it('says nothing when every scenario judged the rule', () => {
    expect(judgedShare({ verdict: 'follows', basis: [entry('follows'), entry('follows')] })).toBe(
      undefined,
    );
  });

  it('says nothing for an inconclusive verdict or a file without a basis', () => {
    expect(judgedShare({ verdict: 'inconclusive', basis: [entry('inconclusive')] })).toBe(
      undefined,
    );
    expect(judgedShare({ verdict: 'follows' })).toBe(undefined);
  });
});
