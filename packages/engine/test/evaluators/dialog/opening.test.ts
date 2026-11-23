import { describe, expect, it } from 'vitest';
import { evaluateFocusNotOnDialog } from '../../../src/evaluators/dialog/focus-not-on-dialog.ts';
import { evaluateModal } from '../../../src/evaluators/dialog/modal.ts';
import { evaluateNameMatchesTitle } from '../../../src/evaluators/dialog/name-matches-title.ts';
import { evaluateNamedDialog } from '../../../src/evaluators/dialog/named-dialog.ts';
import { evaluateOpenFocus } from '../../../src/evaluators/dialog/open-focus.ts';
import {
  closedDialog,
  inside,
  name,
  onButton,
  onContainer,
  onDocument,
  openDialog,
  walk,
} from './fixtures.ts';

const opened = (dialog = openDialog()) =>
  walk('open', [['Enter', inside('textbox', 'Name', dialog)]]);
const didNotOpen = walk('open', [['Enter', onButton(closedDialog)]]);

describe('open-focus', () => {
  it('follows when focus is inside the dialog after Enter', () => {
    expect(evaluateOpenFocus(walk('open', [['Enter', name]]))).toMatchObject({
      verdict: 'follows',
      reason: 'Enter opened the dialog and focus moved to textbox "Name", inside it.',
    });
  });

  it('follows on the dialog container: where inside is another rule', () => {
    expect(evaluateOpenFocus(walk('open', [['Enter', onContainer()]])).verdict).toBe('follows');
  });

  it('differs when focus stays on the button', () => {
    expect(evaluateOpenFocus(walk('open', [['Enter', onButton(openDialog())]]))).toMatchObject({
      verdict: 'differs',
      summary: 'Focus stays on the button',
    });
  });

  it('differs when focus falls to the document', () => {
    expect(evaluateOpenFocus(walk('open', [['Enter', onDocument(openDialog())]]))).toMatchObject({
      verdict: 'differs',
      reason: 'Enter opened the dialog and focus was on the document, outside it.',
    });
  });

  it('is inconclusive when the dialog did not open', () => {
    expect(evaluateOpenFocus(didNotOpen)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'The dialog did not open',
    });
  });

  it('is inconclusive when a step did not settle', () => {
    const input = walk('open', [['Enter', name]], { quiet: false });
    expect(evaluateOpenFocus(input).summary).toBe('Observations incomplete');
  });

  it('is inconclusive for a scenario it was not written for', () => {
    expect(evaluateOpenFocus(walk('escape', [['Enter', name]])).summary).toBe(
      'Scenario not supported',
    );
  });
});

describe('focus-not-on-dialog', () => {
  it('follows when focus is on an element in the dialog', () => {
    expect(evaluateFocusNotOnDialog(opened()).verdict).toBe('follows');
  });

  it('differs when focus is on the dialog container', () => {
    expect(evaluateFocusNotOnDialog(walk('open', [['Enter', onContainer()]]))).toMatchObject({
      verdict: 'differs',
      reason: 'After opening, focus was on the dialog container, dialog "Edit profile".',
    });
  });

  it('is not judged when focus did not move into the dialog: that is open-focus', () => {
    const input = walk('open', [['Enter', onButton(openDialog())]]);
    expect(evaluateFocusNotOnDialog(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Focus did not move into the dialog',
    });
  });
});

describe('named-dialog', () => {
  it('follows with the role dialog and a name, whichever way the name is given', () => {
    expect(evaluateNamedDialog(opened(openDialog({ name: 'Profile' })))).toMatchObject({
      verdict: 'follows',
      reason: 'The open dialog is exposed as dialog "Profile".',
    });
  });

  it('differs when the name is empty', () => {
    expect(evaluateNamedDialog(opened(openDialog({ name: '' })))).toMatchObject({
      verdict: 'differs',
      summary: 'The dialog has no name',
    });
  });

  it('differs when the role is not dialog', () => {
    expect(evaluateNamedDialog(opened(openDialog({ role: 'group' })))).toMatchObject({
      verdict: 'differs',
      reason: 'The open dialog is exposed with the role group, not dialog.',
    });
  });

  it('is inconclusive when no dialog is in the tree', () => {
    expect(evaluateNamedDialog(didNotOpen).verdict).toBe('inconclusive');
  });
});

describe('name-matches-title', () => {
  it('follows when the name is the visible title', () => {
    expect(evaluateNameMatchesTitle(opened()).verdict).toBe('follows');
  });

  it('differs when a person would hear one title and see another', () => {
    expect(evaluateNameMatchesTitle(opened(openDialog({ name: 'Profile' })))).toMatchObject({
      verdict: 'differs',
      reason: 'The dialog is named "Profile" and its visible title is "Edit profile".',
    });
  });

  it('is not judged without a name: that is named-dialog', () => {
    expect(evaluateNameMatchesTitle(opened(openDialog({ name: '' })))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'The dialog has no name',
    });
  });

  it('is inconclusive when the dialog has no heading to compare with', () => {
    expect(evaluateNameMatchesTitle(opened(openDialog({ heading: null })))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'No heading in the dialog',
    });
  });
});

describe('modal', () => {
  it('follows when the tree reports the dialog as modal', () => {
    expect(evaluateModal(opened()).verdict).toBe('follows');
  });

  it('differs when it does not', () => {
    expect(evaluateModal(opened(openDialog({ modal: false })))).toMatchObject({
      verdict: 'differs',
      summary: 'The dialog is not exposed as modal',
    });
  });

  it('is inconclusive when the dialog did not open', () => {
    expect(evaluateModal(didNotOpen).verdict).toBe('inconclusive');
  });
});
