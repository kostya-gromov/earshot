import { describe, expect, it } from 'vitest';
import { evaluateTab } from '../../../src/evaluators/input-with-chips/tab.ts';
import { evaluatorInput, focus, removeFocus, step } from './fixtures.ts';

describe('evaluateTab', () => {
  it('follows when Tab leaves from a chip in one step', () => {
    const result = evaluateTab(
      evaluatorInput('tab-from-chip', [
        step({ focusAfter: removeFocus(3), action: { type: 'press', key: 'ArrowLeft' } }),
        step({
          focusBefore: removeFocus(3),
          focusAfter: focus({ role: 'textbox', name: 'Subject', isInsideComponent: false }),
          action: { type: 'press', key: 'Tab' },
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('differs when Tab remains inside the field', () => {
    const result = evaluateTab(
      evaluatorInput('tab-from-chip', [
        step({ focusAfter: removeFocus(3) }),
        step({ focusBefore: removeFocus(3), focusAfter: focus() }),
      ]),
    );
    expect(result.verdict).toBe('differs');
  });

  it('is inconclusive when the setup ArrowLeft did not focus a chip', () => {
    const result = evaluateTab(
      evaluatorInput('tab-from-chip', [
        step({ focusAfter: focus() }),
        step({
          focusAfter: focus({ role: 'textbox', name: 'Subject', isInsideComponent: false }),
        }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'inconclusive',
      summary: 'No chip to Tab from',
      reason: 'ArrowLeft did not focus a chip, so Tab from a chip could not be tested.',
    });
  });

  it('is inconclusive, not differs, when ArrowLeft focused an item with no set position', () => {
    // Precondition not met: the same chip test as the arrows rule, so one defect counts once.
    const token = focus({
      role: 'generic',
      name: 'typescript (press backspace or delete to remove)',
    });
    const result = evaluateTab(
      evaluatorInput('tab-from-chip', [
        step({ focusAfter: token, action: { type: 'press', key: 'ArrowLeft' } }),
        step({ focusBefore: token, focusAfter: focus(), action: { type: 'press', key: 'Tab' } }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'inconclusive',
      summary: 'Focused item is not a recognisable chip',
      reason:
        'ArrowLeft focused generic "typescript (press backspace or delete to remove)", which exposes no set position and is not one of the chips the adapter locates, so it cannot be read as a chip and Tab from a chip could not be tested.',
    });
  });

  it('is inconclusive when Tab moves focus to the document', () => {
    // A demo page with nothing focusable after the component: Tab goes to the browser chrome and
    // the document reports body. That cannot be told apart from focus loss in the recording.
    const result = evaluateTab(
      evaluatorInput('tab-out', [
        step({
          action: { type: 'press', key: 'Tab' },
          focusAfter: focus({ role: null, name: '', isBody: true, isInsideComponent: false }),
        }),
        step({ action: { type: 'press', key: 'Shift+Tab' }, focusAfter: focus() }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'inconclusive',
      summary: 'Tab reached the document',
      reason:
        'Tab moved focus to the document. The page has no focusable element after the component, so leaving cannot be told apart from focus loss.',
    });
  });

  it('follows when Shift+Tab from the input leaves the component', () => {
    const result = evaluateTab(
      evaluatorInput('shift-tab-out', [
        step({
          action: { type: 'press', key: 'Shift+Tab' },
          focusAfter: focus({ role: 'textbox', name: 'From', isInsideComponent: false }),
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('says where focus went when Shift+Tab stops on a remove button', () => {
    const result = evaluateTab(
      evaluatorInput('shift-tab-out', [
        step({
          action: { type: 'press', key: 'Shift+Tab' },
          focusAfter: focus({ role: 'button', name: 'Remove Canberra' }),
        }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'differs',
      summary: 'Shift+Tab stops on button inside the field',
      reason: 'Shift+Tab moved focus to button "Remove Canberra" inside the component.',
    });
  });

  it('is inconclusive when Shift+Tab moves focus to the document', () => {
    const result = evaluateTab(
      evaluatorInput('shift-tab-out', [
        step({
          action: { type: 'press', key: 'Shift+Tab' },
          focusAfter: focus({ role: null, name: '', isBody: true, isInsideComponent: false }),
        }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'inconclusive',
      summary: 'Shift+Tab reached the document',
      reason:
        'Shift+Tab moved focus to the document. The page has no focusable element before the component, so leaving cannot be told apart from focus loss.',
    });
  });

  it('is inconclusive when the expected step is missing', () => {
    expect(evaluateTab(evaluatorInput('tab-from-chip', [])).verdict).toBe('inconclusive');
  });
});
