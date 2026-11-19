import type { CDPSession } from '@playwright/test';
import { flattenSubtree, type AxEntry } from '../model/ax-tree.ts';
import { backendNodeIdOf, evaluateNode, fullAxTree, releaseGroup } from './cdp.ts';

const GROUP = 'earshot-ax';

/** The component root's accessibility subtree, flattened for diffing (ADR 0003, section 3). */
export async function readAxSubtree(cdp: CDPSession): Promise<AxEntry[]> {
  try {
    const rootId = await evaluateNode(cdp, {
      expression: 'window.__earshot.root()',
      objectGroup: GROUP,
    });
    if (!rootId) throw new Error('Component root is not set; call setComponentRoot first.');
    const backendId = await backendNodeIdOf(cdp, rootId);
    return flattenSubtree(await fullAxTree(cdp), backendId);
  } finally {
    await releaseGroup(cdp, GROUP);
  }
}
