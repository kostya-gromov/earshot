import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Measurement } from '@earshot/contracts';
import {
  comboboxPlaces,
  comboboxScenario,
  describeComboboxChange,
  describeComboboxStep,
} from '../../src/lib/combobox-replay';

// Read from the engine's own files, so the replay is tested on what was really recorded.
const folder = path.join(import.meta.dirname, '../../../../data', 'measurements', 'combobox');
const load = (adapter: string) =>
  Measurement.parse(JSON.parse(readFileSync(path.join(folder, `${adapter}.json`), 'utf8')));

const marks = (options: readonly { name: string; isActive: boolean; isSelected: boolean }[]) =>
  options.map(
    ({ name, isActive, isSelected }) =>
      `${name}${isActive ? ' active' : ''}${isSelected ? ' selected' : ''}`,
  );

describe('comboboxScenario', () => {
  it('follows the text, the list and the active option of the reference', () => {
    const steps = comboboxScenario(load('reference'), 'type-then-move');
    expect(steps.map(({ key }) => key)).toEqual(['“a”', 'ArrowDown', 'ArrowDown', 'ArrowUp']);
    expect(steps[0]?.after).toMatchObject({ value: 'a', isExpanded: true, hasPopup: true });
    expect(marks(steps[1]?.after.options ?? [])).toEqual([
      'Apple active selected',
      'Apricot',
      'Avocado',
    ]);
    expect(steps[0]?.written).toEqual(['3 suggestions']);
    expect(steps.every(({ after }) => after.focus.kind === 'combobox')).toBe(true);
  });

  it('shows a system whose active option is not the selected one, as recorded', () => {
    const steps = comboboxScenario(load('mui'), 'type-then-move');
    expect(marks(steps[1]?.after.options ?? [])).toEqual(['Apple active', 'Apricot', 'Avocado']);
  });

  it('shows the chosen value still selected while another option is active', () => {
    const last = comboboxScenario(load('mui'), 'reopen').at(-1);
    expect(marks(last?.after.options ?? []).slice(0, 2)).toEqual([
      'Apple selected',
      'Apricot active',
    ]);
  });

  it('keeps a region inserted with its text apart from what was written', () => {
    const [typed] = comboboxScenario(load('mui'), 'no-match');
    expect(typed?.written).toEqual([]);
    expect(typed?.inserted).toEqual(['No options']);
  });

  it('follows focus out of the combobox', () => {
    const [tab] = comboboxScenario(load('reference'), 'tab-out');
    expect(tab?.after.focus).toEqual({ kind: 'outside', role: 'textbox', name: 'Note' });
  });

  it('has nothing to replay for a scenario the file does not hold', () => {
    expect(comboboxScenario(load('reference'), 'nope')).toEqual([]);
  });
});

describe('describeComboboxStep', () => {
  it('says what the list holds and where focus is', () => {
    const steps = comboboxScenario(load('reference'), 'type-then-move');
    expect(steps.map(describeComboboxStep)).toEqual([
      '3 options, none active, none selected. Focus in the combobox',
      '3 options, “Apple” active (1 of 3), “Apple” selected. Focus in the combobox',
      '3 options, “Apricot” active (2 of 3), “Apricot” selected. Focus in the combobox',
      '3 options, “Apple” active (1 of 3), “Apple” selected. Focus in the combobox',
    ]);
  });

  it('says both marks when they sit on different options', () => {
    const last = comboboxScenario(load('mui'), 'reopen').at(-1);
    expect(last && describeComboboxStep(last)).toBe(
      '6 options, “Apricot” active (2 of 6), “Apple” selected. Focus in the combobox',
    );
  });

  it('says when the list is gone and focus left', () => {
    const [tab] = comboboxScenario(load('reference'), 'tab-out');
    expect(tab && describeComboboxStep(tab)).toBe('No list. Focus left the field: Note');
  });
});

describe('describeComboboxChange', () => {
  it('says only what each step changed', () => {
    const steps = comboboxScenario(load('reference'), 'type-then-move');
    expect(steps.map(describeComboboxChange)).toEqual([
      'The list opens with 3 options. “a” in the field.',
      '“Apple” active, 1 of 3, and selected.',
      '“Apricot” active, 2 of 3, and selected.',
      '“Apple” active, 1 of 3, and selected.',
    ]);
  });

  it('says when the chosen value stays selected under another active option', () => {
    const steps = comboboxScenario(load('mui'), 'reopen');
    expect(steps.slice(2).map(describeComboboxChange)).toEqual([
      'The list closes. “Apple” in the field.',
      'The list opens with 6 options. “Apple” active, 1 of 6, and selected.',
      '“Apricot” active, 2 of 6. “Apple” stays selected.',
    ]);
  });

  it('says when focus moves', () => {
    const [tab, back] = comboboxScenario(load('reference'), 'tab-out');
    expect(tab && describeComboboxChange(tab)).toBe('Focus left the field: Note.');
    expect(back && describeComboboxChange(back)).toBe('Focus in the combobox.');
  });
});

// Design review 2026-11-14: after Tab the replay drew the next control's empty value as the
// combobox's, and wrote "The field is empty" under three systems, one of which keeps its text.
describe('the text in the field once focus has left it', () => {
  const lastOf = (adapter: string) => comboboxScenario(load(adapter), 'tab-open').at(-1);

  it('stays what it was when the recording shows no change', () => {
    const tab = lastOf('reference');
    expect(tab?.after.value).toBe('a');
    expect(tab && describeComboboxChange(tab)).toBe('The list closes. Focus left the field: Note.');
  });

  it('becomes the value the system fills in as focus leaves', () => {
    const tab = lastOf('react-aria');
    expect(tab?.after.value).toBe('Apple');
    expect(tab && describeComboboxChange(tab)).toContain('“Apple” in the field.');
  });

  it('is empty only where the recording shows the field cleared', () => {
    const tab = lastOf('mui');
    expect(tab?.after.value).toBe('');
    expect(tab && describeComboboxChange(tab)).toContain('The field is empty.');
  });

  it('says nothing about the field when focus comes back to unchanged text', () => {
    const back = comboboxScenario(load('reference'), 'tab-out').at(-1);
    expect(back && describeComboboxChange(back)).toBe('Focus in the combobox.');
  });
});

// Design review 2026-11-14: "One Tab stop" drew the same picture for a system that follows and
// one that differs, because the replay did not show where focus went.
describe('where focus goes besides the combobox', () => {
  it('names the next control on the page', () => {
    expect(comboboxPlaces(comboboxScenario(load('reference'), 'tab-out'))).toEqual({
      inside: undefined,
      outside: 'Note',
    });
  });

  it('names a control of the combobox that takes focus', () => {
    const steps = comboboxScenario(load('fluent'), 'tab-out');
    expect(comboboxPlaces(steps).inside).toBe('Open Fruit');
    expect(steps[0] && describeComboboxChange(steps[0])).toBe('Focus on button “Open Fruit”.');
  });

  it('has no place to draw where focus never leaves the combobox', () => {
    expect(comboboxPlaces(comboboxScenario(load('reference'), 'type-then-move'))).toEqual({
      inside: undefined,
      outside: undefined,
    });
  });
});
