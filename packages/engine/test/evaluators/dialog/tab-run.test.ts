import { describe, expect, it } from 'vitest';
import { evaluateContained } from '../../../src/evaluators/dialog/contained.ts';
import { evaluateWrap } from '../../../src/evaluators/dialog/wrap.ts';
import {
  cancel,
  leftPage,
  name,
  onButton,
  onContainer,
  onDocument,
  openDialog,
  outside,
  save,
  walk,
  type Moment,
} from './fixtures.ts';

/** Enter, then one press of `key` for every moment focus rested on. */
const run = (id: string, key: string, [start, ...rests]: readonly Moment[]) =>
  walk(id, [['Enter', start!], ...rests.map((rest) => [key, rest] as const)]);

const forward = (start: Moment, rests: readonly Moment[]) =>
  run('tab-forward', 'Tab', [start, ...rests]);
const backward = (rests: readonly Moment[]) => run('tab-backward', 'Shift+Tab', [name, ...rests]);

const round = [cancel, save, name, cancel, save, name];
const behind = outside('textbox', 'Notes', openDialog());
// The native element: the page loses focus to the browser's controls, then the first field has it.
const native = [cancel, save, leftPage(), name, cancel, save];

describe('contained', () => {
  it('follows when every press leaves focus inside the dialog', () => {
    expect(evaluateContained(forward(name, round))).toMatchObject({
      verdict: 'follows',
      reason: 'Focus was inside the dialog after each of 6 presses of Tab.',
      judgedSteps: 6,
    });
  });

  it('differs when Tab lands on the page behind the open dialog', () => {
    expect(evaluateContained(forward(name, [cancel, save, behind]))).toMatchObject({
      verdict: 'differs',
      reason: 'Tab from button "Save" left focus on textbox "Notes", outside the open dialog.',
    });
  });

  it('differs when focus falls to the document while the page keeps focus', () => {
    const input = forward(name, [cancel, save, onDocument(openDialog())]);
    expect(evaluateContained(input).summary).toBe('Focus falls to the document');
  });

  it('does not charge Tab that leaves the page for the browser’s controls: that is wrap', () => {
    expect(evaluateContained(forward(name, native))).toMatchObject({
      verdict: 'follows',
      judgedSteps: 5,
    });
  });

  it('is inconclusive when focus never was inside the dialog', () => {
    const stayed = onButton(openDialog());
    expect(evaluateContained(forward(stayed, [stayed, stayed]))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Focus was never inside the dialog',
    });
  });
});

describe('wrap', () => {
  it('follows when Tab comes round to an element focus had been on', () => {
    expect(evaluateWrap(forward(name, round))).toMatchObject({
      verdict: 'follows',
      judgedSteps: 6,
    });
    expect(evaluateWrap(forward(name, round)).reason).toContain(
      'Tab came round inside the dialog: after 3 presses focus was again on textbox "Name". Focus rested on: button "Cancel", button "Save", textbox "Name"',
    );
  });

  it('follows backwards: Shift+Tab from the first goes round to the last', () => {
    const result = evaluateWrap(backward([save, cancel, name, save, cancel, name]));
    expect(result.verdict).toBe('follows');
    // Not "Shift+Tab on Cancel": that press is not the one that went round the end.
    expect(result.reason).toContain(
      'Shift+Tab came round inside the dialog: after 3 presses focus was again on textbox "Name". Focus rested on: button "Save", button "Cancel", textbox "Name"',
    );
  });

  it('follows when focus started on the container, which Tab never returns to', () => {
    expect(
      evaluateWrap(forward(onContainer(), [name, cancel, save, name, cancel, save])).verdict,
    ).toBe('follows');
  });

  it('differs when Tab at the end leaves the page before it comes back', () => {
    expect(evaluateWrap(forward(name, native))).toMatchObject({
      verdict: 'differs',
      summary: 'Tab leaves the page at the end',
      reason:
        'Tab on button "Save" took focus off the page: the document no longer had focus. A later press put it on textbox "Name", inside the dialog.',
    });
  });

  it('does not say focus came back when no later press was inside the dialog', () => {
    expect(evaluateWrap(forward(name, [cancel, save, leftPage()]))).toMatchObject({
      verdict: 'differs',
      reason:
        'Tab on button "Save" took focus off the page: the document no longer had focus, and no later press of the run put it back inside the dialog.',
    });
  });

  it('differs when Tab stops on the last element', () => {
    expect(evaluateWrap(forward(name, [cancel, save, save, save]))).toMatchObject({
      verdict: 'differs',
      reason: 'Tab on button "Save" left focus where it was.',
    });
  });

  it('is not judged when focus left the dialog for the page behind: that is contained', () => {
    expect(evaluateWrap(forward(name, [cancel, save, behind]))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Focus left the dialog',
    });
  });

  it('is inconclusive when the presses did not reach the end', () => {
    expect(evaluateWrap(forward(name, [cancel, save]))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'The run did not come round',
    });
  });
});
