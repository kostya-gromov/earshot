import type { CDPSession, Page } from '@playwright/test';
import type { RawAxNode } from '../model/raw-ax.ts';

/*
 * Thin, typed helpers over the Chrome DevTools Protocol. Remote objects are created in a
 * named group and released together, so long runs do not leak page memory.
 */

export type NodeRef = { objectId: string } | { backendNodeId: number };

export async function openCdp(page: Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('Accessibility.enable');
  return cdp;
}

/** Evaluates an expression that returns a DOM node; null when it returns null. */
export async function evaluateNode(
  cdp: CDPSession,
  { expression, objectGroup }: { expression: string; objectGroup: string },
): Promise<string | null> {
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
    expression,
    objectGroup,
  });
  if (exceptionDetails) throw new Error(`Page evaluation failed: ${exceptionDetails.text}`);
  return result.subtype === 'null' ? null : (result.objectId ?? null);
}

/** Calls `function () { ... }` with `this` bound to the remote object and returns its JSON value. */
export async function callOn<T>(
  cdp: CDPSession,
  { objectId, functionDeclaration }: { objectId: string; functionDeclaration: string },
): Promise<T> {
  const { result, exceptionDetails } = await cdp.send('Runtime.callFunctionOn', {
    objectId,
    functionDeclaration,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(`Page call failed: ${exceptionDetails.text}`);
  return result.value as T;
}

export async function backendNodeIdOf(cdp: CDPSession, objectId: string): Promise<number> {
  const { node } = await cdp.send('DOM.describeNode', { objectId });
  return node.backendNodeId;
}

/**
 * The node's AX node plus its ancestors and children. Despite the protocol docs, siblings
 * come back only as ids in the parent's childIds; use childAxNodes for them.
 */
export async function axNodeWithRelatives(cdp: CDPSession, ref: NodeRef): Promise<RawAxNode[]> {
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
    ...ref,
    fetchRelatives: true,
  });
  return nodes;
}

export async function childAxNodes(cdp: CDPSession, parentAxId: string): Promise<RawAxNode[]> {
  const { nodes } = await cdp.send('Accessibility.getChildAXNodes', { id: parentAxId });
  return nodes;
}

export async function fullAxTree(cdp: CDPSession): Promise<RawAxNode[]> {
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  return nodes;
}

export async function releaseGroup(cdp: CDPSession, objectGroup: string): Promise<void> {
  await cdp.send('Runtime.releaseObjectGroup', { objectGroup });
}
