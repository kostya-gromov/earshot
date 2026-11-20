import { chromium, type Browser, type Page } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openCdp } from '../../src/capture/cdp.ts';
import { installPageScripts } from '../../src/capture/install.ts';
import { readTabSet, type TabSetLocators } from '../../src/capture/tab-set.ts';

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

const locators: TabSetLocators = {
  tabs: (p: Page) => p.getByRole('tab', { includeHidden: true }),
  panels: (p: Page) => p.locator('[role="tabpanel"]'),
};

const tabList = `
  <div role="tablist" aria-label="Project">
    <button role="tab" id="t1" aria-selected="true" aria-controls="p1">Overview</button>
    <button role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">Members</button>
  </div>`;

async function tabSetOf(html: string) {
  const context = await browser.newContext();
  await installPageScripts(context);
  const p = await context.newPage();
  await p.setContent(html);
  const state = await readTabSet({ page: p, cdp: await openCdp(p) }, locators);
  await context.close();
  return state;
}

describe('readTabSet', () => {
  it('reads every tab with its selected state and the shown panel with its name', async () => {
    const state = await tabSetOf(`${tabList}
      <div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">Text</div>
      <div role="tabpanel" id="p2" aria-labelledby="t2" hidden>More</div>`);
    // Chromium also exposes `invalid: false` on a button tab; only the selected state matters here.
    expect(state.tabs.map(({ role, name, states }) => [role, name, states.selected])).toEqual([
      ['tab', 'Overview', true],
      ['tab', 'Members', false],
    ]);
    expect(state.panels).toEqual([expect.objectContaining({ role: 'tabpanel', name: 'Overview' })]);
  });

  // The rule `selected` charges a tab with no selected state; that rests on Chromium leaving the
  // state out, not filling in false or inferring it from focus (verdict audit 2026-11-19, M3).
  it('gives a tab without aria-selected no selected state, even while it has focus', async () => {
    const page = `<div role="tablist" aria-label="Project">
      <button role="tab" aria-selected="true">Overview</button>
      <button role="tab" autofocus>Members</button></div>`;
    const [, members] = (await tabSetOf(page)).tabs;
    expect(members?.states.selected).toBeUndefined();
  });

  it('lists two panels when the page shows both', async () => {
    const state = await tabSetOf(`${tabList}
      <div role="tabpanel" aria-labelledby="t1">Text</div>
      <div role="tabpanel" aria-labelledby="t2">More</div>`);
    expect(state.panels.map((panel) => panel.name)).toEqual(['Overview', 'Members']);
  });

  it('lists no panel when none is in the page', async () => {
    expect((await tabSetOf(tabList)).panels).toEqual([]);
  });
});
