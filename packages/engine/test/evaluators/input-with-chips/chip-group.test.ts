import { describe, expect, it } from 'vitest';
import {
  chipArrowsPrecondition,
  evaluateChipArrows,
} from '../../../src/evaluators/input-with-chips/chip-arrows.ts';
import {
  chipStopPrecondition,
  evaluateChipStop,
} from '../../../src/evaluators/input-with-chips/chip-stop.ts';
import { evaluatorInput, focus, removeFocus, step } from './fixtures.ts';

// Decided 2026-11-10 (second verdict audit): APG asks for one Tab stop and arrow keys within a
// composite widget. These rules judge the chips as that widget, starting on the last chip, so
// they do not depend on how a system joins the chips to the input.
const lastChip = removeFocus(3);
const press = (key: string) => ({ type: 'press' as const, key });
const input = focus();
const outside = focus({ role: 'textbox', name: 'Subject', isInsideComponent: false });

describe('evaluateChipStop', () => {
  it('follows when Tab from a chip leaves the chips, to the input or out of the field', () => {
    for (const after of [input, outside]) {
      const result = evaluateChipStop(
        evaluatorInput('chip-tab', [
          step({ action: press('Tab'), focusBefore: lastChip, focusAfter: after }),
        ]),
      );
      expect(result.verdict).toBe('follows');
    }
  });

  // Verdict audit 2026-11-17: React Aria's Shift+Tab row said "The chips are one Tab stop"
  // under a rule that differs, because its Tab stops inside the chip. A scenario presses one
  // key; what it says is what that key did.
  it('says what the key did, not the whole rule, when one scenario follows', () => {
    const result = evaluateChipStop(
      evaluatorInput('chip-shift-tab', [
        step({ action: press('Shift+Tab'), focusBefore: lastChip, focusAfter: input }),
      ]),
    );
    expect(result).toMatchObject({ verdict: 'follows', summary: 'Shift+Tab leaves the chips' });
  });

  it('differs when Shift+Tab from a chip stops on another chip', () => {
    expect(
      evaluateChipStop(
        evaluatorInput('chip-shift-tab', [
          step({ action: press('Shift+Tab'), focusBefore: lastChip, focusAfter: removeFocus(2) }),
        ]),
      ),
    ).toEqual({
      verdict: 'differs',
      summary: 'Shift+Tab moves to another chip',
      reason: 'From chip 3, Shift+Tab moved focus to chip 2: each chip is its own Tab stop.',
    });
  });

  // React Aria: Tab from a tag row moves to that tag's own remove button.
  it('differs, and says so, when Tab stops on a control inside the same chip', () => {
    const row = focus({ role: 'row', name: 'Hiroshi Matsui', item: { index: 3, count: 3 } });
    const remove = focus({
      role: 'button',
      name: 'Remove Hiroshi Matsui',
      item: { index: 3, count: 3 },
    });
    expect(
      evaluateChipStop(
        evaluatorInput('chip-tab', [
          step({ action: press('Tab'), focusBefore: row, focusAfter: remove }),
        ]),
      ),
    ).toEqual({
      verdict: 'differs',
      summary: 'Tab stops on a control inside the chip',
      reason:
        'From chip 3, Tab moved focus to button "Remove Hiroshi Matsui" inside the same chip: a second Tab stop within the chips.',
    });
  });

  it('is inconclusive when the scenario did not start on a chip', () => {
    expect(
      evaluateChipStop(
        evaluatorInput('chip-tab', [step({ action: press('Tab'), focusBefore: input })]),
      ).verdict,
    ).toBe('inconclusive');
  });
});

describe('evaluateChipArrows', () => {
  it('follows when Left and Right Arrow move to the neighbouring chip and back', () => {
    const result = evaluateChipArrows(
      evaluatorInput('chip-arrows', [
        step({ action: press('ArrowLeft'), focusBefore: lastChip, focusAfter: removeFocus(2) }),
        step({ action: press('ArrowRight'), focusBefore: removeFocus(2), focusAfter: lastChip }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'follows',
      summary: 'Arrows move between chips',
      reason: 'From chip 3, Left Arrow moved to chip 2 and Right Arrow back to chip 3.',
    });
  });

  it('differs when Left Arrow does not move to the previous chip', () => {
    expect(
      evaluateChipArrows(
        evaluatorInput('chip-arrows', [
          step({ action: press('ArrowLeft'), focusBefore: lastChip, focusAfter: lastChip }),
          step({ action: press('ArrowRight'), focusBefore: lastChip, focusAfter: lastChip }),
        ]),
      ),
    ).toEqual({
      verdict: 'differs',
      summary: 'Left Arrow does not move to the previous chip',
      reason: 'From chip 3, Left Arrow left focus on button "Remove item 3", not on chip 2.',
    });
  });

  it('is inconclusive when the scenario did not start on a chip', () => {
    expect(
      evaluateChipArrows(evaluatorInput('chip-arrows', [step({ focusBefore: input }), step()]))
        .verdict,
    ).toBe('inconclusive');
  });
});

// Third verdict audit, 2026-11-10: arrow keys move inside a composite widget. When the chips are
// separate Tab stops, that one design is judged by chip-stop and not charged again here.
describe('chipArrowsPrecondition', () => {
  it('leaves chip-arrows unjudged when Tab moves from one chip to another', () => {
    expect(
      chipArrowsPrecondition([
        {
          scenarioId: 'chip-shift-tab',
          steps: [
            step({ action: press('Shift+Tab'), focusBefore: lastChip, focusAfter: removeFocus(2) }),
          ],
        },
      ]),
    ).toEqual({
      verdict: 'inconclusive',
      summary: 'Each chip is its own Tab stop',
      reason:
        'In chip-shift-tab, Shift+Tab moved from chip 3 to chip 2: the chips are separate Tab stops, not one composite widget, so arrow keys inside them are not expected. "The chips are one Tab stop" covers it.',
    });
  });

  it('applies nothing when Tab leaves the chips, or stops inside the same chip', () => {
    const inner = focus({ role: 'button', name: 'Remove item 3', item: { index: 3, count: 3 } });
    const row = focus({ role: 'row', name: 'item 3', item: { index: 3, count: 3 } });
    expect(
      chipArrowsPrecondition([
        { scenarioId: 'chip-tab', steps: [step({ focusBefore: lastChip, focusAfter: input })] },
        { scenarioId: 'chip-tab', steps: [step({ focusBefore: row, focusAfter: inner })] },
      ]),
    ).toBeUndefined();
  });
});

// Verdict audit 2026-11-11 (B1), as the owner chose: chips are one widget when arrow keys move between
// them. Separate controls in the tab sequence with no arrow keys are what APG allows outside a
// composite widget, so chip-stop and chip-arrows do not apply; tab judges the extra stops.
describe('separate controls (not one composite widget)', () => {
  const tabToChip = {
    scenarioId: 'chip-shift-tab',
    steps: [
      step({ action: press('Shift+Tab'), focusBefore: lastChip, focusAfter: removeFocus(2) }),
    ],
  };
  const arrowsStay = {
    scenarioId: 'chip-arrows',
    steps: [
      step({ action: press('ArrowLeft'), focusBefore: lastChip, focusAfter: lastChip }),
      step({ action: press('ArrowRight'), focusBefore: lastChip, focusAfter: lastChip }),
    ],
  };
  const arrowsMove = {
    scenarioId: 'chip-arrows',
    steps: [
      step({ action: press('ArrowLeft'), focusBefore: lastChip, focusAfter: removeFocus(2) }),
      step({ action: press('ArrowRight'), focusBefore: removeFocus(2), focusAfter: lastChip }),
    ],
  };

  it('makes chip-stop not applicable, and says why', () => {
    const verdict = chipStopPrecondition([tabToChip, arrowsStay]);
    expect(verdict?.verdict).toBe('not-applicable');
    expect(verdict?.summary).toBe('Separate controls, not one widget');
    expect(verdict?.reason).toMatch(/APG asks for one Tab stop only inside a composite widget/);
    expect(verdict?.reason).toMatch(/"One stop for the whole field" judges the extra stops/);
  });

  it('makes chip-arrows not applicable too', () => {
    expect(chipArrowsPrecondition([tabToChip, arrowsStay])?.verdict).toBe('not-applicable');
  });

  it('judges chip-stop as usual when arrow keys do move between the chips', () => {
    expect(chipStopPrecondition([tabToChip, arrowsMove])).toBeUndefined();
    // Then the extra Tab stop is charged once, to chip-stop, as decided on 2026-11-10.
    expect(chipArrowsPrecondition([tabToChip, arrowsMove])?.verdict).toBe('inconclusive');
  });

  it('judges chip-stop as usual when Tab leaves the chips, or when arrows were not recorded', () => {
    const tabOut = {
      scenarioId: 'chip-tab',
      steps: [step({ focusBefore: lastChip, focusAfter: input })],
    };
    expect(chipStopPrecondition([tabOut, arrowsStay])).toBeUndefined();
    expect(chipStopPrecondition([tabToChip])).toBeUndefined();
  });
});
