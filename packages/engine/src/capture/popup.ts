import type { CDPSession, Locator, Page } from '@playwright/test';
import type { PopupState } from '@earshot/contracts';
import { releaseGroup } from './cdp.ts';
import { exposedNodes } from './exposed-nodes.ts';

/*
 * A pattern's popup and its options, as assistive technology sees them (ADR 0003, amendment of
 * 2026-11-14). The adapter says where they are, because systems often render a popup at the end
 * of the page, outside the component root that the tree diff covers.
 */

const GROUP = 'earshot-popup';

export interface PopupLocators {
  popup: (page: Page) => Locator;
  options: (page: Page) => Locator;
  opener?: ((page: Page) => Locator) | undefined;
}

export async function readPopup(
  session: { page: Page; cdp: CDPSession },
  locators: PopupLocators,
): Promise<PopupState> {
  const read = (key: string, locate: (page: Page) => Locator) =>
    exposedNodes(session, { key, locator: locate(session.page), objectGroup: GROUP });
  try {
    const popups = await read('popup', locators.popup);
    const options = await read('options', locators.options);
    const openers = locators.opener ? await read('opener', locators.opener) : [];
    const [opener] = openers;
    return { present: popups.length > 0, options, ...(opener ? { opener } : {}) };
  } finally {
    await releaseGroup(session.cdp, GROUP);
  }
}
