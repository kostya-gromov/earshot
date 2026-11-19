import { describe, expect, it } from 'vitest';
import { checkRunRequest } from '../../src/features/run-it/run-request';

describe('checkRunRequest', () => {
  it('accepts a public https story address', () => {
    expect(checkRunRequest({ url: ' https://storybook.example.com/?path=/story/chips ' })).toEqual({
      ok: true,
      url: 'https://storybook.example.com/?path=/story/chips',
    });
  });

  it('asks for a URL when the field is empty', () => {
    expect(checkRunRequest({ url: '  ' })).toEqual({
      ok: false,
      field: 'url',
      message: 'Enter the address of a public page, for example a Storybook story.',
    });
  });

  it.each(['storybook.example.com', 'http://example.com/story', 'ftp://example.com'])(
    'rejects %s, which is not a full https address',
    (url) => {
      expect(checkRunRequest({ url })).toMatchObject({
        ok: false,
        message: 'Enter a full public URL that starts with https://.',
      });
    },
  );

  it.each([
    'https://localhost:6006',
    'https://127.0.0.1/',
    'https://192.168.1.4/story',
    'https://box.local/',
  ])('rejects %s, which only your own network can reach', (url) => {
    expect(checkRunRequest({ url })).toMatchObject({ ok: false, field: 'url' });
  });
});
