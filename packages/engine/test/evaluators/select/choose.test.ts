import { describe, expect, it } from 'vitest';
import { evaluateEnter } from '../../../src/evaluators/select/enter.ts';
import { evaluateEscape } from '../../../src/evaluators/select/escape.ts';
import { evaluateEscapeKeepsValue } from '../../../src/evaluators/select/escape-keeps-value.ts';
import { active, closed, elsewhere, walk, type Moment } from './fixtures.ts';

const toCherry = (key: string, after: Moment) =>
  walk(key === 'Enter' ? 'enter' : 'escape', closed(), [
    ['ArrowDown', active('Banana')],
    ['ArrowDown', active('Cherry')],
    [key, after],
  ]);

describe('evaluateEnter', () => {
  it('follows when Enter closes the list and the value becomes the active option', () => {
    expect(evaluateEnter(toCherry('Enter', closed({ value: 'Cherry' }))).verdict).toBe('follows');
  });

  it('follows when the select leaves the tree while the list is open (MUI, 2026-11-24)', () => {
    const hidden = (moment: Moment): Moment => {
      const { opener: _, ...popup } = moment.popup;
      return { ...moment, popup };
    };
    const input = walk('enter', closed(), [
      ['ArrowDown', hidden(active('Banana'))],
      ['ArrowDown', hidden(active('Cherry'))],
      ['Enter', closed({ value: 'Cherry' })],
    ]);
    expect(evaluateEnter(input).verdict).toBe('follows');
  });

  it('differs when the value stays as it was', () => {
    expect(evaluateEnter(toCherry('Enter', closed()))).toMatchObject({
      verdict: 'differs',
      reason:
        'Enter on the active option "Cherry": the select\'s value was "Banana", not "Cherry".',
    });
  });

  it('differs when the list stays open', () => {
    expect(evaluateEnter(toCherry('Enter', active('Cherry'))).verdict).toBe('differs');
  });

  it('leaves a select with no value to name-and-value', () => {
    expect(evaluateEnter(toCherry('Enter', closed({ value: '' })))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'The select exposes no value',
    });
  });
});

describe('evaluateEscape', () => {
  it('follows when Escape closes the list and focus stays on the select', () => {
    expect(evaluateEscape(toCherry('Escape', closed())).verdict).toBe('follows');
  });

  it('differs when focus leaves the select', () => {
    expect(evaluateEscape(toCherry('Escape', elsewhere()))).toMatchObject({
      summary: 'Focus leaves the select',
    });
  });

  it('is not judged when the list was not open', () => {
    const input = walk('escape', closed(), [['Escape', closed()]]);
    expect(evaluateEscape(input).verdict).toBe('inconclusive');
  });
});

describe('evaluateEscapeKeepsValue', () => {
  it('follows when the value stays as it was before the list opened', () => {
    expect(evaluateEscapeKeepsValue(toCherry('Escape', closed())).verdict).toBe('follows');
  });

  it('differs when Escape keeps the option moved to, even with focus gone', () => {
    expect(
      evaluateEscapeKeepsValue(toCherry('Escape', elsewhere('Notes', { value: 'Cherry' }))),
    ).toMatchObject({
      verdict: 'differs',
      reason:
        'The value was "Banana" before the list opened; with "Cherry" active, after Escape it was "Cherry".',
    });
  });

  it('is not judged when no other option became active', () => {
    const input = walk('escape', closed(), [
      ['ArrowDown', active('Banana')],
      ['Escape', closed()],
    ]);
    expect(evaluateEscapeKeepsValue(input)).toMatchObject({
      summary: 'No other option was active',
    });
  });
});
