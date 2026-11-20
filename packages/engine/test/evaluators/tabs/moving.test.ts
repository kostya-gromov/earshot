import { describe, expect, it } from 'vitest';
import { evaluateArrows } from '../../../src/evaluators/tabs/arrows.ts';
import { evaluateVerticalKeysFree } from '../../../src/evaluators/tabs/vertical-keys-free.ts';
import { evaluateWrap } from '../../../src/evaluators/tabs/wrap.ts';
import { fieldBefore, onTab, walk } from './fixtures.ts';

describe('arrows', () => {
  it('follows with automatic activation, and says the selection followed', () => {
    const input = walk('move', onTab('Overview'), [
      ['ArrowRight', onTab('Activity')],
      ['ArrowRight', onTab('Members')],
      ['ArrowLeft', onTab('Activity')],
    ]);
    const result = evaluateArrows(input);
    expect(result).toMatchObject({ verdict: 'follows', judgedSteps: 3 });
    expect(result.reason).toContain(
      'Right Arrow moved focus from "Overview" to "Activity"; "Activity" became the active tab.',
    );
  });

  it('follows with manual activation, and says the selection stayed', () => {
    const input = walk('move', onTab('Overview'), [['ArrowRight', onTab('Activity', 'Overview')]]);
    expect(evaluateArrows(input).reason).toBe(
      'Right Arrow moved focus from "Overview" to "Activity"; the selection stayed on "Overview".',
    );
  });

  it('differs when Right Arrow skips a tab', () => {
    const input = walk('move', onTab('Overview'), [['ArrowRight', onTab('Members')]]);
    expect(evaluateArrows(input)).toMatchObject({
      verdict: 'differs',
      reason: 'Right Arrow from "Overview" moved focus to "Members", not to "Activity".',
    });
  });

  it('is not judged when no arrow was pressed on a tab', () => {
    const input = walk('move', fieldBefore('Overview'), [['ArrowRight', fieldBefore('Overview')]]);
    expect(evaluateArrows(input).verdict).toBe('inconclusive');
  });
});

describe('wrap', () => {
  it('follows when both ends wrap', () => {
    const input = walk('ends', onTab('Overview'), [
      ['ArrowLeft', onTab('Settings')],
      ['ArrowRight', onTab('Overview')],
    ]);
    expect(evaluateWrap(input)).toMatchObject({ verdict: 'follows', judgedSteps: 2 });
  });

  it('differs when Left Arrow stays on the first tab', () => {
    const input = walk('ends', onTab('Overview'), [
      ['ArrowLeft', onTab('Overview')],
      ['ArrowRight', onTab('Activity')],
    ]);
    expect(evaluateWrap(input)).toMatchObject({
      verdict: 'differs',
      reason: 'Left Arrow on "Overview" left focus on "Overview", not on "Settings".',
    });
  });

  it('is not judged when no arrow was pressed outward from an end', () => {
    const input = walk('ends', onTab('Activity'), [['ArrowRight', onTab('Members')]]);
    expect(evaluateWrap(input).verdict).toBe('inconclusive');
  });
});

describe('vertical-keys-free', () => {
  it('follows when Down and Up Arrow leave focus and selection alone', () => {
    const input = walk('vertical-keys', onTab('Overview'), [
      ['ArrowDown', onTab('Overview')],
      ['ArrowUp', onTab('Overview')],
    ]);
    expect(evaluateVerticalKeysFree(input).verdict).toBe('follows');
  });

  it('differs when Down Arrow moves to the next tab', () => {
    const input = walk('vertical-keys', onTab('Overview'), [['ArrowDown', onTab('Activity')]]);
    expect(evaluateVerticalKeysFree(input)).toMatchObject({
      verdict: 'differs',
      reason: 'Down Arrow moved focus from tab "Overview" to tab "Activity".',
    });
  });

  it('is not judged when a step did not settle', () => {
    const input = walk('vertical-keys', onTab('Overview'), [['ArrowDown', onTab('Overview')]]);
    const unsettled = {
      ...input,
      steps: input.steps.map((s) => ({ ...s, settle: { ms: 1000, quiet: false } })),
    };
    expect(evaluateVerticalKeysFree(unsettled).verdict).toBe('inconclusive');
  });
});

describe('wrap, when the arrow keys do nothing at all', () => {
  it('is not judged: one missing feature is charged to arrows alone', () => {
    const input = walk('ends', onTab('Overview'), [
      ['ArrowLeft', onTab('Overview')],
      ['ArrowRight', onTab('Overview')],
    ]);
    expect(evaluateWrap(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Arrow keys did not move focus',
    });
  });
});
