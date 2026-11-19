import { chromium, type Browser, type Page } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openCdp } from '../../src/capture/cdp.ts';
import { installPageScripts } from '../../src/capture/install.ts';
import { readPopup, type PopupLocators } from '../../src/capture/popup.ts';

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

// The listbox sits at the end of the page, outside the field, as a portal renders it.
const page = (listbox: string) => `
  <div id="field"><input role="combobox" aria-expanded="true" aria-label="Fruit" /></div>
  <p>Other content</p>
  ${listbox}`;

const locators: PopupLocators = {
  popup: (p: Page) => p.locator('#l'),
  options: (p: Page) => p.locator('#l [role="option"]'),
};

async function popupOf(html: string) {
  const context = await browser.newContext();
  await installPageScripts(context);
  const p = await context.newPage();
  await p.setContent(html);
  const state = await readPopup({ page: p, cdp: await openCdp(p) }, locators);
  await context.close();
  return state;
}

describe('readPopup', () => {
  it('reads the options of a popup rendered outside the component', async () => {
    const state = await popupOf(
      page(`<ul id="l" role="listbox" aria-label="Fruit">
        <li role="option" aria-selected="true">Apple</li>
        <li role="option" aria-selected="false">Apricot</li></ul>`),
    );
    expect(state.present).toBe(true);
    expect(state.options).toEqual([
      { role: 'option', name: 'Apple', states: { selected: true } },
      { role: 'option', name: 'Apricot', states: { selected: false } },
    ]);
  });

  it('says a popup that is not on the page is not present', async () => {
    expect(await popupOf(page(''))).toEqual({ present: false, options: [] });
  });

  it('does not count a popup the page keeps but hides', async () => {
    const state = await popupOf(
      page(`<ul id="l" role="listbox" hidden><li role="option">Apple</li></ul>`),
    );
    expect(state).toEqual({ present: false, options: [] });
  });

  it('keeps a shown popup with no options apart from a closed one', async () => {
    const state = await popupOf(page(`<ul id="l" role="listbox" aria-label="Fruit"></ul>`));
    expect(state).toEqual({ present: true, options: [] });
  });
});
