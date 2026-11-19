import { describe, expect, it } from 'vitest';
import { evaluateEscape } from '../../../src/evaluators/menu-button/escape.ts';
import { evaluateTab } from '../../../src/evaluators/menu-button/tab.ts';
import { closed, elsewhere, on, onDocument, openMenu, pointingAt, walk } from './fixtures.ts';

describe('tab', () => {
  const tabTo = (after: Parameters<typeof walk>[1][number][1]) =>
    walk('tab-open', [
      ['Enter', on('Rename')],
      ['Tab', after],
    ]);

  it('follows when Tab moves focus out and the menu closes', () => {
    expect(evaluateTab(tabTo(elsewhere()))).toMatchObject({
      verdict: 'follows',
      reason: 'Tab moved focus out of the menu, to textbox "Note", and the menu closed.',
    });
  });

  it('differs when Tab moves to another item', () => {
    expect(evaluateTab(tabTo(on('Duplicate')))).toMatchObject({
      verdict: 'differs',
      summary: 'Tab stays in the menu',
    });
  });

  it('says focus stayed where it was when Tab does nothing in the menu', () => {
    expect(evaluateTab(tabTo(on('Rename'))).reason).toBe(
      'Tab left focus where it was, on menuitem "Rename", and the menu stayed shown with 4 items.',
    );
    const pointing = walk('tab-open', [
      ['Enter', pointingAt('Rename')],
      ['Tab', pointingAt('Rename')],
    ]);
    expect(evaluateTab(pointing).reason).toBe(
      'Tab left focus where it was, on menu "Actions", and the menu stayed shown with 4 items.',
    );
  });

  it('says focus moved when Tab lands on another item', () => {
    expect(evaluateTab(tabTo(on('Duplicate'))).reason).toBe(
      'Tab moved focus to menuitem "Duplicate", inside the menu.',
    );
  });

  it('differs when focus leaves and the menu stays shown', () => {
    expect(evaluateTab(tabTo(elsewhere('Note', openMenu()))).reason).toBe(
      'Tab moved focus to textbox "Note" and left the menu shown with 4 items.',
    );
  });

  it('is not judged when the menu was not shown before Tab', () => {
    const input = walk('tab-open', [
      ['Enter', closed()],
      ['Tab', elsewhere()],
    ]);
    expect(evaluateTab(input)).toMatchObject({
      verdict: 'inconclusive',
      summary: 'Menu not shown',
    });
  });
});

describe('escape', () => {
  const escapeTo = (after: Parameters<typeof walk>[1][number][1]) =>
    walk('escape', [
      ['Enter', on('Rename')],
      ['ArrowDown', on('Duplicate')],
      ['Escape', after],
    ]);

  it('follows when Escape closes the menu and focus is on the button', () => {
    expect(evaluateEscape(escapeTo(closed())).verdict).toBe('follows');
  });

  it('differs when the menu stays open', () => {
    expect(evaluateEscape(escapeTo(on('Duplicate'))).summary).toBe('Menu stays open after Escape');
  });

  it('differs when the menu closes and focus falls to the document', () => {
    expect(evaluateEscape(escapeTo(onDocument()))).toMatchObject({
      verdict: 'differs',
      reason: 'Escape closed the menu and focus was on the document.',
    });
  });

  it('is not judged when the menu was not shown before Escape', () => {
    const input = walk('escape', [
      ['Enter', closed()],
      ['Escape', closed()],
    ]);
    expect(evaluateEscape(input).verdict).toBe('inconclusive');
  });
});
