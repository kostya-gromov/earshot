import type { CDPSession, Locator, Page } from '@playwright/test';
import type { AccessibleNode } from '@earshot/contracts';
import { toAccessibleNode } from '../model/raw-ax.ts';
import { axNodeWithRelatives, backendNodeIdOf, evaluateNode } from './cdp.ts';

/*
 * The elements a locator finds, as the accessibility tree exposes them: an element the tree
 * leaves out (hidden, display: none) is not listed. Shared by the popup and the tab set, which
 * both read a group of elements wherever on the page they are rendered.
 */

export interface ExposedNodesQuery {
  /** Names the held elements on the page and the CDP object group, so readers do not collide. */
  key: string;
  locator: Locator;
  objectGroup: string;
}

/** The element's node in the accessibility tree; undefined when the tree leaves it out. */
async function exposedNode(
  cdp: CDPSession,
  { key, index, objectGroup }: { key: string; index: number; objectGroup: string },
): Promise<AccessibleNode | undefined> {
  const objectId = await evaluateNode(cdp, {
    expression: `window.__earshot.heldNode(${JSON.stringify(key)}, ${index})`,
    objectGroup,
  });
  if (!objectId) return undefined;
  const backendNodeId = await backendNodeIdOf(cdp, objectId);
  const nodes = await axNodeWithRelatives(cdp, { backendNodeId });
  const self = nodes.find((node) => node.backendDOMNodeId === backendNodeId);
  return self && !self.ignored ? toAccessibleNode(self) : undefined;
}

/** The caller releases `objectGroup` once it has read everything it needs. */
export async function exposedNodes(
  { page, cdp }: { page: Page; cdp: CDPSession },
  { key, locator, objectGroup }: ExposedNodesQuery,
): Promise<AccessibleNode[]> {
  const hold = (elements: Element[], name: string) => window.__earshot.holdNodes(name, elements);
  const count = await locator.evaluateAll(hold, key);
  const nodes: AccessibleNode[] = [];
  for (let index = 0; index < count; index += 1) {
    const node = await exposedNode(cdp, { key, index, objectGroup });
    if (node) nodes.push(node);
  }
  // Nothing on this page keeps the elements alive for us.
  await page.evaluate((name) => window.__earshot.holdNodes(name, []), key);
  return nodes;
}
