import type { CDPSession, Locator, Page } from '@playwright/test';
import type { TabSetState } from '@earshot/contracts';
import { releaseGroup } from './cdp.ts';
import { exposedNodes } from './exposed-nodes.ts';

/*
 * Every tab and every shown panel, as assistive technology sees them (tabs, engine 0.17.0). The
 * rules judge the whole set after each step: one tab selected, one panel shown, named by it.
 */

const GROUP = 'earshot-tab-set';

export interface TabSetLocators {
  tabs: (page: Page) => Locator;
  panels: (page: Page) => Locator;
}

export async function readTabSet(
  session: { page: Page; cdp: CDPSession },
  locators: TabSetLocators,
): Promise<TabSetState> {
  const read = (key: string, locate: (page: Page) => Locator) =>
    exposedNodes(session, { key, locator: locate(session.page), objectGroup: GROUP });
  try {
    return {
      tabs: await read('tabs', locators.tabs),
      panels: await read('panels', locators.panels),
    };
  } finally {
    await releaseGroup(session.cdp, GROUP);
  }
}
