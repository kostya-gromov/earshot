import { describe, expect, it } from 'vitest';
import { describeFallback, hasDecidingScenario, ruleWideResult } from '../../src/lib/lane-verdict';

const scenario = {
  scenario: 'chip-arrows',
  verdict: 'inconclusive',
  summary: 'Flaky',
  reason: '',
} as const;

describe('ruleWideResult', () => {
  it('gives a scenario the verdict the engine reached before judging any scenario', () => {
    const verdict = {
      verdict: 'not-applicable',
      summary: 'Separate controls, not one widget',
      basis: [],
    } as const;
    expect(ruleWideResult(verdict, 'chip-arrows')).toEqual({
      scenario: 'chip-arrows',
      verdict: 'not-applicable',
      summary: 'Separate controls, not one widget',
      reason: '',
    });
  });

  it('says nothing when the file records each scenario its own result', () => {
    const verdict = { verdict: 'inconclusive', summary: 'Flaky', basis: [scenario] } as const;
    expect(ruleWideResult(verdict, 'chip-arrows')).toBe(undefined);
  });

  it('never gives a scenario a judged verdict the file does not record for it', () => {
    for (const judged of ['follows', 'differs'] as const) {
      expect(ruleWideResult({ verdict: judged, summary: 'Judged', basis: [] }, 'tab')).toBe(
        undefined,
      );
    }
    expect(ruleWideResult(undefined, 'tab')).toBe(undefined);
  });
});

describe('describeFallback', () => {
  it('names the scenario that decided a judged verdict', () => {
    const decided = { ...scenario, verdict: 'differs' } as const;
    expect(describeFallback({ verdict: 'differs', summary: 'Differs', basis: [decided] })).toBe(
      'the scenario that decided its verdict',
    );
  });

  it('does not say a scenario decided a verdict that was not reached', () => {
    expect(describeFallback({ verdict: 'inconclusive', summary: 'Flaky', basis: [scenario] })).toBe(
      'the scenario that says why it was not judged',
    );
  });

  it('names the first scenario when none has a result of its own', () => {
    const ruleWide = {
      verdict: 'not-applicable',
      summary: 'Separate controls',
      basis: [],
    } as const;
    expect(describeFallback(ruleWide)).toBe('the rule’s first scenario');
    expect(describeFallback(undefined)).toBe('the rule’s first scenario');
  });
});

describe('hasDecidingScenario', () => {
  const tab = { ...scenario, scenario: 'chip-tab', verdict: 'follows', summary: 'Tab leaves' };
  const shiftTab = { ...tab, scenario: 'chip-shift-tab', summary: 'Shift+Tab leaves' };

  it('is no single scenario when the rule follows in words of its own', () => {
    const verdict = { verdict: 'follows', summary: 'One Tab stop', basis: [tab, shiftTab] };
    expect(hasDecidingScenario(verdict as never)).toBe(false);
  });

  it('is the scenario whose words the rule’s verdict carries', () => {
    const follows = { verdict: 'follows', summary: 'Tab leaves', basis: [tab, shiftTab] };
    expect(hasDecidingScenario(follows as never)).toBe(true);
    const differs = { ...tab, verdict: 'differs', summary: 'Tab stays' };
    const verdict = { verdict: 'differs', summary: 'Tab stays', basis: [differs, shiftTab] };
    expect(hasDecidingScenario(verdict as never)).toBe(true);
  });

  it('is none when the file records no result per scenario', () => {
    expect(hasDecidingScenario({ verdict: 'follows', summary: 'Follows', basis: [] })).toBe(false);
  });
});
