import { describe, expect, it } from 'vitest';
import { evaluateActivate } from '../../../src/evaluators/menu-button/activate.ts';
import { evaluateDisabled } from '../../../src/evaluators/menu-button/disabled.ts';
import { evaluateFocusReturns } from '../../../src/evaluators/menu-button/focus-returns.ts';
import { closed, elsewhere, names, none, on, onDocument, walk } from './fixtures.ts';

type After = Parameters<typeof walk>[1][number][1];
const ran = 'Last action: Duplicate';

const enterOnDuplicate = (after: After) =>
  walk('activate', [
    ['Enter', on('Rename')],
    ['ArrowDown', on('Duplicate')],
    ['Enter', after],
  ]);

describe('activate', () => {
  it('follows when the action ran and the menu closed', () => {
    expect(evaluateActivate(enterOnDuplicate(closed(ran)))).toMatchObject({
      verdict: 'follows',
      reason:
        'Enter on "Duplicate" ran its action (the page says "Last action: Duplicate") and the menu closed.',
    });
  });

  // The amendment of 2026-11-16: a menu that closes without running anything has not activated.
  it('differs when the menu closes and the action did not run', () => {
    expect(evaluateActivate(enterOnDuplicate(closed()))).toMatchObject({
      verdict: 'differs',
      summary: 'Enter does not run the action',
    });
  });

  it('differs when the action ran and the menu stays open', () => {
    expect(evaluateActivate(enterOnDuplicate(on('Duplicate', names, ran))).summary).toBe(
      'Menu stays open after the action',
    );
  });

  it('differs when another item’s action ran', () => {
    expect(evaluateActivate(enterOnDuplicate(closed('Last action: Delete'))).summary).toBe(
      'Another action ran',
    );
  });

  it('is not judged when no item was active before Enter', () => {
    const input = walk('activate', [
      ['Enter', closed()],
      ['ArrowDown', closed()],
      ['Enter', closed()],
    ]);
    expect(evaluateActivate(input).verdict).toBe('inconclusive');
  });
});

describe('focus-returns', () => {
  it('follows when focus is on the button after the action', () => {
    expect(evaluateFocusReturns(enterOnDuplicate(closed(ran))).verdict).toBe('follows');
  });

  it('differs when focus falls to the document, and says so', () => {
    expect(evaluateFocusReturns(enterOnDuplicate(onDocument(ran)))).toMatchObject({
      verdict: 'differs',
      summary: 'Focus falls to the document',
    });
  });

  it('differs when focus is on another control', () => {
    const after = { ...elsewhere(), effect: ran };
    expect(evaluateFocusReturns(enterOnDuplicate(after)).summary).toBe(
      'Focus is not on the button',
    );
  });

  // Charged once: a menu that did not run the action is the business of "activate".
  it('is not judged when the action did not run', () => {
    expect(evaluateFocusReturns(enterOnDuplicate(closed()))).toMatchObject({
      verdict: 'inconclusive',
      summary: 'No completed action to judge',
    });
  });
});

describe('disabled', () => {
  const run = (afterSecondDown: After, afterEnter: After) =>
    walk('disabled', [
      ['Enter', on('Rename')],
      ['ArrowDown', on('Duplicate')],
      ['ArrowDown', afterSecondDown],
      ['Enter', afterEnter],
    ]);

  it('follows when the arrows reach the disabled item and Enter runs nothing', () => {
    expect(evaluateDisabled(run(on('Archive'), on('Archive')))).toMatchObject({
      verdict: 'follows',
      reason:
        'The arrows reached "Archive", it was exposed as disabled, and Enter on it ran no action. The menu stayed open (recorded, not judged).',
    });
  });

  // APG says only that the item cannot be activated: closing without an action still follows.
  it('follows when Enter closes the menu and runs nothing', () => {
    const result = evaluateDisabled(run(on('Archive'), closed()));
    expect(result.verdict).toBe('follows');
    expect(result.reason).toContain('The menu closed (recorded, not judged).');
  });

  it('differs when the arrows skip the disabled item', () => {
    expect(evaluateDisabled(run(on('Delete'), closed('Last action: Delete')))).toMatchObject({
      verdict: 'differs',
      summary: 'Arrows skip the disabled item',
      reason: 'Down Arrow at the place of the disabled "Archive" made "Delete" (4 of 4) active.',
    });
  });

  it('differs when Enter runs the disabled item’s action', () => {
    expect(evaluateDisabled(run(on('Archive'), closed('Last action: Archive'))).summary).toBe(
      'Enter activates the disabled item',
    );
  });

  it('differs when no item is exposed as disabled', () => {
    const enabled = ['Rename', 'Duplicate', 'Delete'];
    const input = walk('disabled', [
      ['Enter', on('Rename', enabled)],
      ['ArrowDown', on('Duplicate', enabled)],
      ['ArrowDown', on('Delete', enabled)],
      ['Enter', closed('Last action: Delete')],
    ]);
    expect(evaluateDisabled(input).summary).toBe('No item is exposed as disabled');
  });

  it('is not judged when the menu was not shown', () => {
    const input = walk('disabled', [
      ['Enter', closed()],
      ['ArrowDown', closed()],
      ['ArrowDown', closed()],
      ['Enter', closed(none)],
    ]);
    expect(evaluateDisabled(input).verdict).toBe('inconclusive');
  });
});
