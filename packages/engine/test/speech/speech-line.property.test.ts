import type { Announcement } from '@earshot/contracts';
import fc from 'fast-check';
import { expect, it } from 'vitest';
import { synthesizeSpeech } from '../../src/speech/speech-line.ts';
import { focus } from './fixtures.ts';

const text = fc
  .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), {
    minLength: 1,
    maxLength: 20,
  })
  .map((characters) => characters.join(''));

const announcements = fc.array(
  fc.record({
    text,
    politeness: fc.constantFrom<Announcement['politeness']>('polite', 'assertive'),
    at: fc.nat(),
    insertedLate: fc.boolean(),
  }),
  { maxLength: 20 },
);

it('keeps assertive and polite announcement order around focus speech', () => {
  fc.assert(
    fc.property(announcements, (items) => {
      const input = {
        documentTitle: 'Atlas',
        focusBefore: focus({ path: '#before' }),
        focusAfter: focus({ path: '#after' }),
        announcements: items,
      };
      const expected = [
        ...items.filter((item) => item.politeness === 'assertive').map((item) => item.text),
        'To, combobox',
        ...items.filter((item) => item.politeness === 'polite').map((item) => item.text),
      ];
      const result = synthesizeSpeech(input);

      expect(result).toEqual(expected);
      expect(result.every((line) => line.length > 0)).toBe(true);
      expect(result.every((line) => !line.includes('undefined') && !line.includes('null'))).toBe(
        true,
      );
      expect(synthesizeSpeech(input)).toEqual(result);
    }),
    { numRuns: 200 },
  );
});
