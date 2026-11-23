import type { CDPSession } from '@playwright/test';
import type { AccessibleNode, FocusInfo } from '@earshot/contracts';
import { popupKindOf } from '../model/popup-kind.ts';
import { propertyOf, toAccessibleNode, type RawAxNode } from '../model/raw-ax.ts';
import {
  ancestorChain,
  findSetItem,
  positionAmong,
  type SetPosition,
} from '../model/set-position.ts';
import {
  axNodeWithRelatives,
  backendNodeIdOf,
  callOn,
  childAxNodes,
  evaluateNode,
  releaseGroup,
} from './cdp.ts';
import type { FocusFacts } from './page/globals.d.ts';

/*
 * Who has focus, as assistive technology sees it (ADR 0003, section 1). The DOM tells us
 * which element; Chromium's accessibility tree tells us its role, name and states.
 */

const GROUP = 'earshot-focus';

const NO_NODE: AccessibleNode = { role: null, name: '', states: {} };

/** An AX node and the relatives CDP returned with it. */
interface Located {
  self: RawAxNode | undefined;
  nodes: RawAxNode[];
}

async function locate(cdp: CDPSession, backendNodeId: number): Promise<Located> {
  const nodes = await axNodeWithRelatives(cdp, { backendNodeId });
  return { self: nodes.find((n) => n.backendDOMNodeId === backendNodeId), nodes };
}

/** "3 of 3": author-provided when present, otherwise derived from siblings. */
async function positionOf(
  cdp: CDPSession,
  { self, nodes }: Located,
  facts?: Pick<FocusFacts, 'ariaPosInSet' | 'ariaSetSize'>,
): Promise<SetPosition | undefined> {
  if (facts?.ariaPosInSet && facts.ariaSetSize) {
    return { posInSet: facts.ariaPosInSet, setSize: facts.ariaSetSize };
  }
  const item = self && findSetItem(ancestorChain(nodes, self));
  const parent = item && nodes.find((n) => n.nodeId === item.parentId);
  if (!item || !parent) return undefined;
  return positionAmong([parent, ...(await childAxNodes(cdp, parent.nodeId))], item);
}

async function describe(cdp: CDPSession, located: Located, facts?: FocusFacts) {
  const base = located.self ? toAccessibleNode(located.self) : NO_NODE;
  const position = await positionOf(cdp, located, facts);
  const hasPopup = popupKindOf(facts?.ariaHasPopup ?? null, base.role);
  const states = hasPopup ? { ...base.states, hasPopup } : base.states;
  return { ...base, states, ...position };
}

async function activeDescendantOf(cdp: CDPSession, self: RawAxNode | undefined) {
  const target = self && propertyOf(self, 'activedescendant')?.relatedNodes?.[0];
  if (!target) return undefined;
  return describe(cdp, await locate(cdp, target.backendDOMNodeId));
}

/** The attribute may be set and still lead nowhere: that is recorded, not dropped. */
function activeDescendantFields(
  activeDescendant: AccessibleNode | undefined,
  facts: Pick<FocusFacts, 'activeDescendantId'>,
): Pick<FocusInfo, 'activeDescendant' | 'activeDescendantUnresolved'> {
  if (activeDescendant) return { activeDescendant };
  return facts.activeDescendantId ? { activeDescendantUnresolved: true } : {};
}

export async function readFocus(cdp: CDPSession): Promise<FocusInfo> {
  try {
    const objectId = await evaluateNode(cdp, {
      expression: 'window.__earshot.deepActiveElement()',
      objectGroup: GROUP,
    });
    if (!objectId) return { ...NO_NODE, isBody: true, isInsideComponent: false };

    const facts = await callOn<FocusFacts>(cdp, {
      objectId,
      functionDeclaration: 'function () { return window.__earshot.describeFocus(this); }',
    });
    const located = await locate(cdp, await backendNodeIdOf(cdp, objectId));
    const activeDescendant = await activeDescendantOf(cdp, located.self);
    return {
      ...(await describe(cdp, located, facts)),
      isBody: facts.isBody,
      isInsideComponent: facts.isInsideComponent,
      ...activeDescendantFields(activeDescendant, facts),
      ...(facts.value === null ? {} : { value: facts.value }),
      ...(facts.pageHasFocus ? {} : { leftPage: true as const }),
      path: facts.path,
      element: facts.element,
    };
  } finally {
    await releaseGroup(cdp, GROUP);
  }
}
