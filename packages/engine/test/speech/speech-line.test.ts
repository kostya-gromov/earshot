import { describe, expect, it } from 'vitest';
import { synthesizeSpeech } from '../../src/speech/speech-line.ts';
import { announcement, focus } from './fixtures.ts';

describe('synthesizeSpeech', () => {
  it('orders assertive announcements, focus and polite announcements', () => {
    const lines = synthesizeSpeech({
      documentTitle: 'Atlas',
      focusBefore: focus(),
      focusAfter: focus({
        role: 'button',
        name: 'Remove Hiroshi Matsui',
        posInSet: 3,
        setSize: 3,
        path: '#hiroshi',
      }),
      announcements: [
        announcement('Saved', 'polite'),
        announcement('Invalid', 'assertive'),
        announcement('Still invalid', 'assertive'),
      ],
    });

    expect(lines).toEqual([
      'Invalid',
      'Still invalid',
      'Remove Hiroshi Matsui, button, 3 of 3',
      'Saved',
    ]);
  });

  it('uses path to detect focus changes between semantically identical elements', () => {
    expect(
      synthesizeSpeech({
        documentTitle: 'Atlas',
        focusBefore: focus({ path: '#first' }),
        focusAfter: focus({ path: '#second' }),
        announcements: [],
      }),
    ).toEqual(['To, combobox']);
  });

  it('falls back to body, role and name when paths are unavailable', () => {
    expect(
      synthesizeSpeech({
        documentTitle: 'Atlas',
        focusBefore: focus({ path: undefined }),
        focusAfter: focus({ role: 'button', name: 'Remove Irene Oh', path: undefined }),
        announcements: [],
      }),
    ).toEqual(['Remove Irene Oh, button']);
  });

  it('speaks a changed active descendant when DOM focus stays put', () => {
    expect(
      synthesizeSpeech({
        documentTitle: 'Atlas',
        focusBefore: focus({
          activeDescendant: { role: 'option', name: 'One', states: { selected: true } },
        }),
        focusAfter: focus({
          activeDescendant: {
            role: 'option',
            name: 'Two',
            posInSet: 2,
            setSize: 3,
            states: { selected: true },
          },
        }),
        announcements: [],
      }),
    ).toEqual(['Two, option, 2 of 3, selected']);
  });

  it('says the element and then its active descendant when focus lands on it', () => {
    expect(
      synthesizeSpeech({
        documentTitle: 'Atlas',
        focusBefore: focus(),
        focusAfter: focus({
          path: '#other',
          activeDescendant: { role: 'option', name: 'Two', states: { selected: true } },
        }),
        announcements: [],
      }),
    ).toEqual(['To, combobox', 'Two, option, selected']);
  });

  it('describes focus lost to the document body', () => {
    expect(
      synthesizeSpeech({
        documentTitle: 'Atlas',
        focusBefore: focus(),
        focusAfter: focus({
          role: null,
          name: '',
          isBody: true,
          isInsideComponent: false,
          path: 'body',
        }),
        announcements: [],
      }),
    ).toEqual(['Atlas, document']);
  });

  it('uses document when the page title is empty', () => {
    expect(
      synthesizeSpeech({
        documentTitle: '',
        focusBefore: focus(),
        focusAfter: focus({
          role: null,
          name: '',
          isBody: true,
          isInsideComponent: false,
          path: 'body',
        }),
        announcements: [],
      }),
    ).toEqual(['document']);
  });

  it('returns nothing when focus and active descendant are unchanged', () => {
    expect(
      synthesizeSpeech({
        documentTitle: 'Atlas',
        focusBefore: focus(),
        focusAfter: focus(),
        announcements: [],
      }),
    ).toEqual([]);
  });
});
