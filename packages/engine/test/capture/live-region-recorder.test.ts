import { chromium, type Browser, type Page } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { installPageScripts } from '../../src/capture/install.ts';
import { drainAnnouncements, drainInsertedRegions } from '../../src/capture/live-regions.ts';

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

async function pageWith(html: string): Promise<Page> {
  const context = await browser.newContext();
  await installPageScripts(context);
  const page = await context.newPage();
  await page.setContent(html);
  await drainAnnouncements(page);
  await drainInsertedRegions(page);
  return page;
}

const texts = async (page: Page) => (await drainAnnouncements(page)).map(({ text }) => text);

describe('live region recorder', () => {
  it('announces new text in a polite region', async () => {
    const page = await pageWith('<div id="r" aria-live="polite"></div>');
    await page.evaluate(() => (document.getElementById('r')!.textContent = 'Ana Lima added'));
    expect(await texts(page)).toEqual(['Ana Lima added']);
  });

  // React Aria's TagGroup switches its grid from aria-live="off" to "polite" when focus enters.
  it('does not announce existing text when a region becomes live', async () => {
    const page = await pageWith('<div id="r" aria-live="off"><span>Irene Oh</span></div>');
    await page.evaluate(() => document.getElementById('r')!.setAttribute('aria-live', 'polite'));
    expect(await texts(page)).toEqual([]);
  });

  it('does not announce a removal when aria-relevant leaves removals out', async () => {
    const page = await pageWith(
      '<div id="r" aria-live="polite" aria-relevant="additions"><span>Irene Oh</span><span id="g">Greg Fisher</span></div>',
    );
    await page.evaluate(() => document.getElementById('g')!.remove());
    expect(await texts(page)).toEqual([]);
  });

  it('announces a removal by default, when the text changes', async () => {
    const page = await pageWith('<div id="r" aria-live="polite"><span>2 selected</span></div>');
    await page.evaluate(
      () => (document.getElementById('r')!.firstElementChild!.textContent = '1 selected'),
    );
    expect(await texts(page)).toEqual(['1 selected']);
  });

  // MUI's "No options" (measured 2026-11-14): the status region arrives with its text. It is
  // recorded as an inserted region, not as an announcement, so a reason can say what was seen.
  it('keeps a region inserted together with its text apart from announcements', async () => {
    const page = await pageWith('<main id="m"></main>');
    await page.evaluate(() => {
      const region = document.createElement('div');
      region.setAttribute('role', 'status');
      region.textContent = 'No options';
      document.getElementById('m')!.append(region);
    });
    expect(await texts(page)).toEqual([]);
    expect(await drainInsertedRegions(page)).toMatchObject([
      { text: 'No options', politeness: 'polite' },
    ]);
  });

  it('does not report a region inserted empty and written to afterwards as inserted with text', async () => {
    const page = await pageWith('<main id="m"></main>');
    await page.evaluate(() => {
      const region = document.createElement('div');
      region.setAttribute('role', 'status');
      document.getElementById('m')!.append(region);
    });
    await page.evaluate(() => (document.querySelector('[role=status]')!.textContent = '3 results'));
    expect(await drainInsertedRegions(page)).toEqual([]);
    expect(await texts(page)).toEqual(['3 results']);
  });

  // React Aria's announcer (measured 2026-11-14) appends each message to one log; the recording
  // held "3 options available.AppleApricot" where only "Apricot" was new.
  it('records only what was appended to a region that keeps its earlier messages', async () => {
    const page = await pageWith('<div id="r" role="log" aria-live="polite"></div>');
    const append = (text: string) =>
      page.evaluate((message) => {
        const node = document.createElement('div');
        node.textContent = message;
        document.getElementById('r')!.append(node);
      }, text);
    await append('3 options available.');
    expect(await texts(page)).toEqual(['3 options available.']);
    await append('Apple');
    expect(await texts(page)).toEqual(['Apple']);
  });

  it('records a status region whole when text is appended to it', async () => {
    const page = await pageWith('<div id="r" role="status"><span>2 selected</span></div>');
    await page.evaluate(() => document.getElementById('r')!.append(', 1 removed'));
    expect(await texts(page)).toEqual(['2 selected, 1 removed']);
  });
});
