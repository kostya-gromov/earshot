import type { CDPSession, Locator, Page } from '@playwright/test';
import type { AccessibleNode, PopupState } from '@earshot/contracts';
import { toAccessibleNode } from '../model/raw-ax.ts';
import { axNodeWithRelatives, backendNodeIdOf, evaluateNode, releaseGroup } from './cdp.ts';

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

/** The element's node in the accessibility tree; undefined when the tree leaves it out. */
async function exposedNode(
  cdp: CDPSession,
  { key, index }: { key: string; index: number },
): Promise<AccessibleNode | undefined> {
  const objectId = await evaluateNode(cdp, {
    expression: `window.__earshot.heldNode(${JSON.stringify(key)}, ${index})`,
    objectGroup: GROUP,
  });
  if (!objectId) return undefined;
  const backendNodeId = await backendNodeIdOf(cdp, objectId);
  const nodes = await axNodeWithRelatives(cdp, { backendNodeId });
  const self = nodes.find((node) => node.backendDOMNodeId === backendNodeId);
  return self && !self.ignored ? toAccessibleNode(self) : undefined;
}

async function exposedNodes(
  { page, cdp }: { page: Page; cdp: CDPSession },
  { key, locator }: { key: string; locator: Locator },
): Promise<AccessibleNode[]> {
  const hold = (elements: Element[], name: string) => window.__earshot.holdNodes(name, elements);
  const count = await locator.evaluateAll(hold, key);
  const nodes: AccessibleNode[] = [];
  for (let index = 0; index < count; index += 1) {
    const node = await exposedNode(cdp, { key, index });
    if (node) nodes.push(node);
  }
  // Nothing on this page keeps the elements alive for us.
  await page.evaluate((name) => window.__earshot.holdNodes(name, []), key);
  return nodes;
}

export async function readPopup(
  session: { page: Page; cdp: CDPSession },
  locators: PopupLocators,
): Promise<PopupState> {
  try {
    const popups = await exposedNodes(session, {
      key: 'popup',
      locator: locators.popup(session.page),
    });
    const options = await exposedNodes(session, {
      key: 'options',
      locator: locators.options(session.page),
    });
    const openers = locators.opener
      ? await exposedNodes(session, { key: 'opener', locator: locators.opener(session.page) })
      : [];
    const [opener] = openers;
    return { present: popups.length > 0, options, ...(opener ? { opener } : {}) };
  } finally {
    await releaseGroup(session.cdp, GROUP);
  }
}
