import { chromium, type Browser, type Page } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openCdp } from '../../src/capture/cdp.ts';
import { readFocus } from '../../src/capture/focus.ts';
import { installPageScripts } from '../../src/capture/install.ts';

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

const combobox = (activeDescendant: string) => `
  <label for="c">Fruit</label>
  <input id="c" role="combobox" aria-expanded="true" aria-controls="l" value="ap"
    aria-activedescendant="${activeDescendant}" />
  <ul id="l" role="listbox" aria-label="Fruit">
    <li id="o1" role="option" aria-selected="true">Apple</li>
    <li id="o2" role="option" aria-selected="false">Apricot</li>
  </ul>`;

async function focusOf(html: string, selector: string) {
  const context = await browser.newContext();
  await installPageScripts(context);
  const page: Page = await context.newPage();
  await page.setContent(html);
  await page.focus(selector);
  const focus = await readFocus(await openCdp(page));
  await context.close();
  return focus;
}

describe('readFocus', () => {
  it('records the text in a focused text field', async () => {
    const focus = await focusOf(combobox('o1'), '#c');
    expect(focus.value).toBe('ap');
  });

  it('resolves an active descendant that names an option', async () => {
    const focus = await focusOf(combobox('o1'), '#c');
    expect(focus.activeDescendant).toMatchObject({ role: 'option', name: 'Apple' });
    expect(focus.activeDescendantUnresolved).toBeUndefined();
  });

  // Seen by script on a measured system (2026-11-13): the attribute named an id no element had.
  it('says when aria-activedescendant names no element', async () => {
    const focus = await focusOf(combobox('o9'), '#c');
    expect(focus.activeDescendant).toBeUndefined();
    expect(focus.activeDescendantUnresolved).toBe(true);
  });

  it('does not flag a combobox that has no active descendant', async () => {
    const focus = await focusOf(combobox(''), '#c');
    expect(focus.activeDescendantUnresolved).toBeUndefined();
  });

  it('never records what is typed in a password field', async () => {
    const focus = await focusOf('<input id="p" type="password" value="secret" />', '#p');
    expect(focus.value).toBeUndefined();
  });

  it('records no value for an element that is not a text field', async () => {
    const focus = await focusOf('<button id="b">Open</button>', '#b');
    expect(focus.value).toBeUndefined();
  });
});
