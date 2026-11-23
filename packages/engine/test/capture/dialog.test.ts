import { chromium, type Browser, type Page } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openCdp } from '../../src/capture/cdp.ts';
import { readDialog, type DialogLocators } from '../../src/capture/dialog.ts';
import { readFocus } from '../../src/capture/focus.ts';
import { installPageScripts } from '../../src/capture/install.ts';

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

const locators: DialogLocators = {
  dialog: (p: Page) => p.locator('#dialog'),
  opener: (p: Page) => p.locator('#open'),
};

const native = `
  <button id="open" onclick="document.getElementById('dialog').showModal()">Edit profile</button>
  <dialog id="dialog" aria-labelledby="title">
    <h2 id="title">Edit profile</h2>
    <input aria-label="Name" /><button>Save</button>
  </dialog>`;

const ariaDiv = `
  <button id="open">Edit profile</button>
  <div id="dialog" role="dialog" aria-modal="true" aria-label="Profile">
    <h2>Edit profile</h2><button>Save</button>
  </div>`;

async function withPage<T>(html: string, read: (p: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext();
  await installPageScripts(context);
  const p = await context.newPage();
  await p.setContent(html);
  try {
    return await read(p);
  } finally {
    await context.close();
  }
}

const dialogOf = async (p: Page) => readDialog({ page: p, cdp: await openCdp(p) }, locators);

describe('readDialog', () => {
  it('reads no dialog while the native element is closed, and the button that opens it', async () => {
    const state = await withPage(native, dialogOf);
    expect(state.dialog).toBeUndefined();
    expect(state.heading).toBeUndefined();
    expect(state.opener).toMatchObject({ role: 'button', name: 'Edit profile' });
  });

  it('reads a native modal dialog as modal, with its title, and the page behind left out', async () => {
    const state = await withPage(native, async (p) => {
      await p.click('#open');
      return dialogOf(p);
    });
    expect(state.dialog).toMatchObject({
      role: 'dialog',
      name: 'Edit profile',
      states: { modal: true },
    });
    expect(state.heading).toBe('Edit profile');
    // The browser makes the page behind inert: the opener is no longer in the tree.
    expect(state.opener).toBeUndefined();
  });

  it('reads aria-modal the same way, a name that is not the title, and the opener still exposed', async () => {
    const state = await withPage(ariaDiv, dialogOf);
    expect(state.dialog).toMatchObject({
      role: 'dialog',
      name: 'Profile',
      states: { modal: true },
    });
    expect(state.heading).toBe('Edit profile');
    expect(state.opener).toMatchObject({ role: 'button', name: 'Edit profile' });
  });
});

describe('focus that leaves the page', () => {
  it('is told apart from focus lost to the document', async () => {
    const [inside, left] = await withPage(native, async (p) => {
      const cdp = await openCdp(p);
      await p.click('#open');
      await p.keyboard.press('Tab');
      const onSave = await readFocus(cdp);
      // Tab on the last element of a native modal dialog goes to the browser's own controls.
      await p.keyboard.press('Tab');
      return [onSave, await readFocus(cdp)];
    });
    expect(inside).toMatchObject({ role: 'button', name: 'Save', isBody: false });
    expect(inside?.leftPage).toBeUndefined();
    expect(left).toMatchObject({ isBody: true, leftPage: true });
  });
});
