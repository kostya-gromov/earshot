import { describe, expect, it } from 'vitest';
import { evaluateExpanded } from '../../../src/evaluators/menu-button/expanded.ts';
import { evaluateOpen } from '../../../src/evaluators/menu-button/open.ts';
import {
  closed,
  hiddenMenu,
  on,
  openMenu,
  openUnfocused,
  pointingAt,
  walk,
  withMenu,
} from './fixtures.ts';

describe('open', () => {
  it('follows when Enter opens the menu on its first item', () => {
    expect(evaluateOpen(walk('open-enter', [['Enter', on('Rename')]]))).toMatchObject({
      verdict: 'follows',
      reason: 'Enter opened the menu and made "Rename", the first of 4 items, active.',
    });
  });

  it('follows a menu that names its first item with aria-activedescendant', () => {
    expect(evaluateOpen(walk('open-space', [['Space', pointingAt('Rename')]])).verdict).toBe(
      'follows',
    );
  });

  it('differs when the menu does not open', () => {
    expect(evaluateOpen(walk('open-space', [['Space', closed()]]))).toMatchObject({
      verdict: 'differs',
      summary: 'Menu does not open',
    });
  });

  it('differs when the menu opens and no item is active', () => {
    expect(evaluateOpen(walk('open-enter', [['Enter', openUnfocused()]]))).toMatchObject({
      verdict: 'differs',
      summary: 'No item is active after opening',
      reason:
        'Enter opened the menu with 4 items and none was active: focus was on button "Actions".',
    });
  });

  it('differs when it opens on another item', () => {
    expect(evaluateOpen(walk('open-enter', [['Enter', on('Delete')]])).summary).toBe(
      'Opens on another item',
    );
  });

  it('is inconclusive for a scenario it was not written for, and for a step that did not settle', () => {
    expect(evaluateOpen(walk('move', [['Enter', on('Rename')]])).summary).toBe(
      'Scenario not supported',
    );
    const unsettled = walk('open-enter', [['Enter', on('Rename')]]);
    const steps = unsettled.steps.map((s) => ({ ...s, settle: { ms: 1000, quiet: false } }));
    expect(evaluateOpen({ ...unsettled, steps }).verdict).toBe('inconclusive');
  });
});

describe('expanded', () => {
  it('follows when the button says expanded while the menu is shown and collapsed after', () => {
    const input = walk('escape', [
      ['Enter', on('Rename')],
      ['Escape', closed()],
    ]);
    expect(evaluateExpanded(input)).toMatchObject({
      verdict: 'follows',
      reason:
        "The button's expanded state matched whether the menu was shown after each of the 2 steps judged (0 not judged).",
    });
  });

  it('differs when the button says collapsed while the menu is shown', () => {
    const wrong = withMenu(on('Rename'), openMenu(false));
    expect(evaluateExpanded(walk('open-enter', [['Enter', wrong]]))).toMatchObject({
      verdict: 'differs',
      reason: 'After step 1 (Enter), the button was exposed as collapsed while the menu was shown.',
    });
  });

  it('differs when the button stays expanded after the menu is gone', () => {
    const input = walk('escape', [
      ['Enter', on('Rename')],
      ['Escape', withMenu(closed(), hiddenMenu(true))],
    ]);
    expect(evaluateExpanded(input).reason).toBe(
      'After step 2 (Escape), the button was exposed as expanded while the menu was hidden.',
    );
  });

  const { opener: _open, ...shownWithoutButton } = openMenu();
  const unstated = { role: 'button', name: 'Actions', states: {} };

  it('is not judged when the button is not in the tree after any step', () => {
    const input = walk('open-enter', [['Enter', withMenu(on('Rename'), shownWithoutButton)]]);
    expect(evaluateExpanded(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Button not in the accessibility tree',
    });
  });

  it('is inconclusive when only the collapsed state could be read', () => {
    const input = walk('escape', [
      ['Enter', withMenu(on('Rename'), shownWithoutButton)],
      ['Escape', closed()],
    ]);
    expect(evaluateExpanded(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Expanded read only while the menu is hidden',
      reason:
        "The button's expanded state matched the menu after 1 step, all with the menu hidden. In no scenario was the button in the accessibility tree while the menu was shown, so that state was never read.",
    });
  });

  it('follows on one state when another scenario of the measurement read the other', () => {
    const opening = walk('open-enter', [['Enter', on('Rename')]]);
    const closing = walk('escape', [
      ['Enter', withMenu(on('Rename'), shownWithoutButton)],
      ['Escape', closed()],
    ]);
    const judgedTogether = { ...closing, recorded: [opening, closing] };
    expect(evaluateExpanded(judgedTogether).verdict).toBe('follows');
    expect(evaluateExpanded({ ...opening, recorded: [opening] }).verdict).toBe('inconclusive');
    const hiddenHere = walk('open-enter', [['Enter', withMenu(on('Rename'), shownWithoutButton)]]);
    expect(evaluateExpanded({ ...hiddenHere, recorded: [hiddenHere, closing] }).reason).toBe(
      'The button was not in the accessibility tree after the one step here. In no scenario was the button in the accessibility tree while the menu was shown, so that state was never read.',
    );
  });

  it('differs when the button is in the tree with no expanded state while the menu is hidden', () => {
    const input = walk('escape', [
      ['Enter', on('Rename')],
      ['Escape', withMenu(closed(), { present: false, options: [], opener: unstated })],
    ]);
    expect(evaluateExpanded(input)).toMatchObject({
      verdict: 'differs',
      summary: 'Button has no expanded state',
      reason:
        'After step 2 (Escape), the button was in the accessibility tree with no expanded state while the menu was hidden.',
    });
  });
});
