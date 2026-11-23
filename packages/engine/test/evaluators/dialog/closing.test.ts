import { describe, expect, it } from 'vitest';
import { evaluateEscape } from '../../../src/evaluators/dialog/escape.ts';
import { evaluateOutsideInert } from '../../../src/evaluators/dialog/outside-inert.ts';
import { evaluateReturnFocus } from '../../../src/evaluators/dialog/return-focus.ts';
import {
  clickOn,
  closedDialog,
  name,
  onButton,
  onContainer,
  onDocument,
  openDialog,
  outside,
  walk,
  type Moment,
} from './fixtures.ts';

const escape = (after: Moment) =>
  walk('escape', [
    ['Enter', name],
    ['Escape', after],
  ]);
const typing = (after: Moment) =>
  walk('escape-typing', [
    ['Enter', name],
    [clickOn('textbox', 'Name'), name],
    [{ type: 'type', text: 'Ada' }, name],
    ['Escape', after],
  ]);
const cancelled = (after: Moment) =>
  walk('cancel', [
    ['Enter', name],
    [clickOn('button', 'Cancel'), after],
  ]);
const clickedOutside = (after: Moment) =>
  walk('outside-click', [
    ['Enter', name],
    [clickOn('textbox', 'Notes', true), after],
  ]);

const notes = (dialog = openDialog()) => outside('textbox', 'Notes', dialog);

describe('escape', () => {
  it('follows when Escape closes the dialog', () => {
    expect(evaluateEscape(escape(onButton()))).toMatchObject({
      verdict: 'follows',
      reason: 'Escape closed the dialog.',
    });
  });

  it('differs when the field takes Escape and the dialog stays open', () => {
    expect(evaluateEscape(typing(name))).toMatchObject({
      verdict: 'differs',
      reason: 'Escape, with text typed into the field, left the dialog open.',
    });
  });

  it('is inconclusive when the dialog was no longer open before Escape', () => {
    const input = walk('escape', [
      ['Enter', name],
      ['Tab', onButton()],
      ['Escape', onButton()],
    ]);
    expect(evaluateEscape(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'The dialog was not open',
    });
  });
});

describe('return-focus', () => {
  it('follows when focus is back on the button after Escape and after Cancel', () => {
    expect(evaluateReturnFocus(escape(onButton())).verdict).toBe('follows');
    expect(evaluateReturnFocus(cancelled(onButton()))).toMatchObject({
      verdict: 'follows',
      reason: 'A click on Cancel closed the dialog and focus was back on button "Edit profile".',
    });
  });

  it('differs when focus falls to the document', () => {
    expect(evaluateReturnFocus(escape(onDocument(closedDialog)))).toMatchObject({
      verdict: 'differs',
      summary: 'Focus falls to the document',
    });
  });

  it('differs when focus lands on another element', () => {
    expect(evaluateReturnFocus(cancelled(notes(closedDialog)))).toMatchObject({
      verdict: 'differs',
      reason:
        'A click on Cancel closed the dialog and focus was on textbox "Notes", not on button "Edit profile".',
    });
  });

  it('is not judged when the dialog did not close: that is escape', () => {
    expect(evaluateReturnFocus(typing(name))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'The dialog did not close',
    });
  });
});

describe('outside-inert', () => {
  it('follows when the click leaves the dialog open and the field without focus', () => {
    expect(evaluateOutsideInert(clickedOutside(onContainer()))).toMatchObject({
      verdict: 'follows',
      summary: 'The page behind cannot be used',
      // Not "a click on the field": the click goes to the point where the field is, on what covers it.
      reason:
        'A click where textbox "Notes" is, behind the dialog, left the dialog open and focus on dialog "Edit profile".',
    });
  });

  it('follows when the click closes the dialog, as APG says some do', () => {
    expect(evaluateOutsideInert(clickedOutside(onButton()))).toMatchObject({
      verdict: 'follows',
      summary: 'A click outside closes the dialog',
      reason: 'A click where textbox "Notes" is, behind the dialog, closed the dialog.',
    });
  });

  it('differs when the field behind takes focus while the dialog stays open', () => {
    expect(evaluateOutsideInert(clickedOutside(notes()))).toMatchObject({
      verdict: 'differs',
      reason:
        'A click where textbox "Notes" is, behind the dialog, put focus on textbox "Notes" while the dialog stayed open.',
    });
  });

  it('is inconclusive when the dialog did not open', () => {
    const input = walk('outside-click', [
      ['Enter', onButton()],
      [clickOn('textbox', 'Notes', true), notes(closedDialog)],
    ]);
    expect(evaluateOutsideInert(input).verdict).toBe('inconclusive');
  });
});
