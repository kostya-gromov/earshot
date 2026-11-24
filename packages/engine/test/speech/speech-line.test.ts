import { describe, expect, it } from 'vitest';
import { synthesizeSpeech } from '../../src/speech/speech-line.ts';
import { announcement, focus } from './fixtures.ts';

describe('synthesizeSpeech', () => {
  it('orders assertive announcements, focus and polite announcements', () => {
    const lines = synthesizeSpeech({
      documentTitle: 'Earshot',
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
        documentTitle: 'Earshot',
        focusBefore: focus({ path: '#first' }),
        focusAfter: focus({ path: '#second' }),
        announcements: [],
      }),
    ).toEqual(['To, combobox']);
  });

  it('falls back to body, role and name when paths are unavailable', () => {
    expect(
      synthesizeSpeech({
        documentTitle: 'Earshot',
        focusBefore: focus({ path: undefined }),
        focusAfter: focus({ role: 'button', name: 'Remove Irene Oh', path: undefined }),
        announcements: [],
      }),
    ).toEqual(['Remove Irene Oh, button']);
  });

  it('speaks a changed active descendant when DOM focus stays put', () => {
    expect(
      synthesizeSpeech({
        documentTitle: 'Earshot',
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
        documentTitle: 'Earshot',
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
        documentTitle: 'Earshot',
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
    ).toEqual(['Earshot, document']);
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
        documentTitle: 'Earshot',
        focusBefore: focus(),
        focusAfter: focus(),
        announcements: [],
      }),
    ).toEqual([]);
  });

  // Tab went on past the page's last or first stop: the document no longer has focus. The model
  // speaks what focus lands on in the page's tree, and there it has nothing to read; "…,
  // document" would say that something was heard (engine 0.20.0).
  it('says nothing about focus when focus left the page, and still says what was announced', () => {
    const away = focus({ role: null, name: '', isBody: true, leftPage: true, path: undefined });
    expect(
      synthesizeSpeech({
        documentTitle: 'Earshot',
        focusBefore: focus({ path: '#first' }),
        focusAfter: away,
        announcements: [],
      }),
    ).toEqual([]);
    expect(
      synthesizeSpeech({
        documentTitle: 'Earshot',
        focusBefore: focus({ path: '#first' }),
        focusAfter: away,
        announcements: [announcement('Saved', 'polite')],
      }),
    ).toEqual(['Saved']);
  });

  it('still names the document when focus fell to it with the page keeping focus', () => {
    expect(
      synthesizeSpeech({
        documentTitle: 'Earshot',
        focusBefore: focus({ path: '#first' }),
        focusAfter: focus({ role: null, name: '', isBody: true, path: undefined }),
        announcements: [],
      }),
    ).toEqual(['Earshot, document']);
  });
});
