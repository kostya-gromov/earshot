import { chromium, type Browser, type Page } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { coversCentre } from '../../src/runner/click-at-centre.ts';

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

// A field at the left edge and a dialog whose box is placed by the test.
const pageWith = (dialogStyle: string, open = true) => `
  <body style="margin:0">
    <input id="notes" style="position:absolute; left:20px; top:300px; width:200px; height:40px" />
    <dialog id="dialog" style="${dialogStyle}"><button>Save</button></dialog>
    <script>${open ? "document.getElementById('dialog').showModal()" : ''}</script>
  </body>`;

async function covers(html: string): Promise<boolean> {
  const page: Page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.setContent(html);
    return await coversCentre(page.locator('#dialog'), page.locator('#notes'));
  } finally {
    await page.close();
  }
}

describe('coversCentre', () => {
  it('is true when the dialog’s own box lies over the centre of the field', async () => {
    expect(await covers(pageWith('margin:0; left:0; top:250px; width:600px; height:200px'))).toBe(
      true,
    );
  });

  it('is false when the dialog is beside the field, though its backdrop covers it', async () => {
    expect(
      await covers(pageWith('margin:0; left:500px; top:250px; width:400px; height:200px')),
    ).toBe(false);
  });

  it('is false when the dialog is closed', async () => {
    expect(await covers(pageWith('margin:0; left:0; top:250px; width:600px', false))).toBe(false);
  });
});
