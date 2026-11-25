import { describe, expect, it } from 'vitest';
import { evaluateNameAndValue } from '../../../src/evaluators/select/name-and-value.ts';
import { evaluateNameIsLabel } from '../../../src/evaluators/select/name-is-label.ts';
import { evaluateTab } from '../../../src/evaluators/select/tab.ts';
import {
  active,
  closed,
  elsewhere,
  focusedList,
  focusedOption,
  walk,
  walkWithLabel,
  type Moment,
} from './fixtures.ts';

const email = elsewhere('Email');
const tabIn = (after: Moment, label = 'Fruit') =>
  walkWithLabel({ scenarioId: 'tab-in', start: email, moves: [['Tab', after]], label });
const tabOpen = (beforeTab: Moment, afterTab: Moment) =>
  walk('tab-open', closed(), [
    ['ArrowDown', active('Banana')],
    ['ArrowDown', beforeTab],
    ['Tab', afterTab],
  ]);

describe('evaluateTab', () => {
  it('follows when Tab from the field before reaches the select', () => {
    expect(evaluateTab(tabIn(closed()))).toMatchObject({ verdict: 'follows' });
  });

  it('differs when Tab from the field before lands elsewhere', () => {
    expect(evaluateTab(tabIn(elsewhere('Notes')))).toMatchObject({
      verdict: 'differs',
      reason: 'Tab from the field before put focus on textbox "Notes".',
    });
  });

  it('follows when Tab with the list open leaves for the next field', () => {
    expect(evaluateTab(tabOpen(active('Cherry'), elsewhere()))).toMatchObject({
      verdict: 'follows',
    });
  });

  it('differs when Tab with the list open lands on an option', () => {
    expect(evaluateTab(tabOpen(active('Cherry'), focusedOption('Date')))).toMatchObject({
      verdict: 'differs',
      summary: 'Tab stops in the list',
    });
  });

  it('is not judged when DOM focus was already on the list (Chakra UI, 2026-11-24)', () => {
    expect(evaluateTab(tabOpen(focusedList('Cherry'), focusedList('Cherry')))).toMatchObject({
      verdict: 'inconclusive',
    });
  });

  it('is not judged when DOM focus was already on an option', () => {
    expect(evaluateTab(tabOpen(focusedOption('Cherry'), elsewhere()))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Focus had already left the select',
    });
  });
});

describe('evaluateNameAndValue', () => {
  it('follows for a combobox named by its label with the value apart', () => {
    expect(evaluateNameAndValue(tabIn(closed()))).toMatchObject({
      verdict: 'follows',
      reason: 'The focused combobox was named "Fruit" and had the value "Banana".',
    });
  });

  it('differs for a button whose name carries the value', () => {
    const button = closed({ role: 'button', name: 'Fruit Banana', value: '' });
    expect(evaluateNameAndValue(tabIn(button))).toMatchObject({
      verdict: 'differs',
      reason:
        'When the select had focus, it was exposed as button, not as a combobox, and it exposed no value; its name was "Fruit Banana".',
    });
  });

  it('names every shortfall, so a rule that points here finds its own (verdict audit, 2026-11-24)', () => {
    const empty = closed({ role: 'button', name: '', value: '' });
    expect(evaluateNameAndValue(tabIn(empty)).reason).toBe(
      'When the select had focus, it was exposed as button, not as a combobox, its name was empty, and it exposed no value.',
    );
  });

  it('differs for a combobox with no value, an empty name, or a name holding the value', () => {
    for (const parts of [{ value: '' }, { name: '' }, { name: 'Fruit: banana' }]) {
      expect(evaluateNameAndValue(tabIn(closed(parts))).verdict).toBe('differs');
    }
  });

  it('is not judged when focus is not on the select', () => {
    expect(evaluateNameAndValue(tabIn(elsewhere()))).toMatchObject({ verdict: 'inconclusive' });
  });
});

describe('evaluateNameIsLabel', () => {
  it('follows when the name is the visible label, case and punctuation aside', () => {
    expect(evaluateNameIsLabel(tabIn(closed(), 'Fruit:'))).toMatchObject({ verdict: 'follows' });
  });

  it('differs when the name says something else', () => {
    expect(evaluateNameIsLabel(tabIn(closed({ name: 'Choose a fruit' })))).toMatchObject({
      verdict: 'differs',
      reason: 'The select was named "Choose a fruit", and its visible label read "Fruit".',
    });
  });

  it('leaves a button whose name holds the value to name-and-value (React Aria, 2026-11-24)', () => {
    const button = closed({ role: 'button', name: 'Banana Fruit', value: '' });
    expect(evaluateNameIsLabel(tabIn(button))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Charged to the name and value',
    });
  });

  it('judges a combobox with no value whose name is its label (Atlassian, 2026-11-24)', () => {
    expect(evaluateNameIsLabel(tabIn(closed({ value: '' })))).toMatchObject({
      verdict: 'follows',
      reason: 'The select was named "Fruit", and its visible label read "Fruit".',
    });
  });

  it('leaves a combobox with no value whose name is more than its label to name-and-value (audit, 2026-11-24)', () => {
    expect(evaluateNameIsLabel(tabIn(closed({ value: '', name: 'Fruit Banana' })))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Charged to the name and value',
    });
  });

  it('leaves a name holding the value, or an empty one, to name-and-value', () => {
    for (const name of ['Fruit Banana', '']) {
      expect(evaluateNameIsLabel(tabIn(closed({ name })))).toMatchObject({
        verdict: 'inconclusive',
        summary: 'Charged to the name and value',
      });
    }
  });
});
