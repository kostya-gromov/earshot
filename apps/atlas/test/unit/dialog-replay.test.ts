import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Measurement } from '@earshot/contracts';
import { describe, expect, it } from 'vitest';
import {
  describeDialogChange,
  dialogAwaySide,
  dialogControlCount,
  dialogControls,
  dialogSteps,
} from '../../src/lib/dialog-replay';

// From the measured files: a replay says nothing the recording does not hold.
const measured = path.join(import.meta.dirname, '../../../../data/measurements/dialog');
const run = (adapter: string, scenarioId: string) => {
  const measurement = Measurement.parse(
    JSON.parse(readFileSync(path.join(measured, `${adapter}.json`), 'utf8')),
  );
  const first = measurement.scenarios.find(({ id }) => id === scenarioId)?.runs[0];
  if (first?.status !== 'completed') throw new Error(`${adapter}: no completed run`);
  return first.steps;
};

describe('a dialog replay', () => {
  it('says that the dialog opens and where focus lands', () => {
    const [opened] = dialogSteps(run('reference', 'open'));
    expect(opened!.before).toMatchObject({ isOpen: false, focus: { kind: 'opener' } });
    expect(opened!.after).toMatchObject({ isOpen: true, name: 'Edit profile', isModal: true });
    expect(describeDialogChange(opened!)).toBe(
      'The dialog “Edit profile” opens. The tree reports it as modal. Focus in the dialog: textbox “Name”.',
    );
  });

  it('names focus on the dialog container, as the variant without autoFocus records it', () => {
    const [opened] = dialogSteps(run('react-aria-default-focus', 'open'));
    expect(opened!.after.focus).toEqual({ kind: 'dialog' });
    expect(describeDialogChange(opened!)).toBe(
      'The dialog “Edit profile” opens. The tree does not report it as modal. Focus on the dialog itself.',
    );
  });

  it('knows the dialog’s controls by their place, and names those focus was on', () => {
    const recorded = run('chakra', 'tab-forward');
    const steps = dialogSteps(recorded);
    // Chakra's example has its own close button: four controls, all visited by six presses.
    expect(dialogControlCount(recorded)).toBe(4);
    expect(dialogControls(steps).map(({ index, name }) => `${index} ${name}`)).toEqual([
      '1 Name',
      '2 Cancel',
      '3 Save',
      '4 Close',
    ]);
    // One press: the count is known, three of the four names are not.
    expect(dialogControlCount(run('chakra', 'open'))).toBe(4);
    expect(dialogControls(dialogSteps(run('chakra', 'open')))).toHaveLength(1);
  });

  it('says where a click on the page behind was made, and what it did', () => {
    const stays = dialogSteps(run('reference', 'outside-click')).at(-1)!;
    expect(stays.clickedAt).toBe('Notes');
    expect(describeDialogChange(stays)).toBe(
      'A click where “Notes” is, behind the dialog. Focus on the dialog itself.',
    );
    const closes = dialogSteps(run('chakra', 'outside-click')).at(-1)!;
    expect(describeDialogChange(closes)).toBe(
      'A click where “Notes” is, behind the dialog. The dialog closes. Focus on the button that opens the dialog.',
    );
    // Fluent 2: the dialog closes and focus is on the document.
    const lost = dialogSteps(run('fluent', 'outside-click')).at(-1)!;
    expect(lost.after.focus).toEqual({ kind: 'body' });
    expect(describeDialogChange(lost)).toContain('The dialog closes. Focus lost to the page.');
  });

  it('has no side to leave the page by where no measured recording leaves it', () => {
    expect(dialogAwaySide(dialogSteps(run('reference', 'tab-forward')))).toBeUndefined();
  });

  it('says what was typed and what was clicked, never "nothing" for a step that did something', () => {
    const steps = dialogSteps(run('fluent', 'escape-typing'));
    const words = steps.map(describeDialogChange);
    // Enter, a click on the field focus is already in, the text, Escape.
    expect(words[1]).toBe('A click on “Name”. Nothing changes.');
    expect(words[2]).toBe('“Ada” typed.');
    expect(words[3]).toContain('The dialog closes.');
  });

  it('carries the opener’s name as the tree gives it', () => {
    expect(dialogSteps(run('mui', 'open'))[0]!.openerName).toBe('EDIT PROFILE');
    expect(dialogSteps(run('reference', 'open'))[0]!.openerName).toBe('Edit profile');
  });

  it('is empty for a recording of another pattern', () => {
    const tabs = Measurement.parse(
      JSON.parse(readFileSync(path.join(measured, '../tabs/reference.json'), 'utf8')),
    );
    const first = tabs.scenarios[0]!.runs[0]!;
    expect(first.status === 'completed' ? dialogSteps(first.steps) : []).toEqual([]);
  });
});
