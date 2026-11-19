import { roleOf, type RawAxNode } from './raw-ax.ts';

/*
 * "3 of 3". Chromium's CDP does not expose posinset/setsize (ADR 0003), so the engine derives
 * them: the nearest set item at or above the focused node, counted among its siblings with
 * the same role. Pure, so the counting rule can be read and tested on its own.
 */

const SET_ITEM_ROLES = new Set([
  'listitem',
  'option',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'treeitem',
  'tab',
  'row',
  'radio',
]);

export interface SetPosition {
  posInSet: number;
  setSize: number;
}

const indexById = (nodes: readonly RawAxNode[]) => new Map(nodes.map((n) => [n.nodeId, n]));

/** The node itself, then its parent, up to the root, as far as `nodes` contains them. */
export function ancestorChain(nodes: readonly RawAxNode[], start: RawAxNode): RawAxNode[] {
  const byId = indexById(nodes);
  const chain: RawAxNode[] = [];
  for (let node: RawAxNode | undefined = start; node; node = byId.get(node.parentId ?? '')) {
    chain.push(node);
  }
  return chain;
}

export function findSetItem(chain: readonly RawAxNode[]): RawAxNode | undefined {
  return chain.find((node) => !node.ignored && SET_ITEM_ROLES.has(roleOf(node) ?? ''));
}

/**
 * Position of `item` among the non-ignored children of its parent that share its role.
 * `nodes` must contain the parent (with childIds) and the siblings.
 */
export function positionAmong(
  nodes: readonly RawAxNode[],
  item: RawAxNode,
): SetPosition | undefined {
  const byId = indexById(nodes);
  const parent = byId.get(item.parentId ?? '');
  if (!parent?.childIds) return undefined;
  const role = roleOf(item);
  const peers = parent.childIds
    .map((id) => byId.get(id))
    .filter((n): n is RawAxNode => !!n && !n.ignored && roleOf(n) === role);
  const index = peers.findIndex((n) => n.nodeId === item.nodeId);
  return index < 0 ? undefined : { posInSet: index + 1, setSize: peers.length };
}
