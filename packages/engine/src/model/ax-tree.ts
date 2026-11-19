import { nameOf, propertyOf, roleOf, type RawAxNode } from './raw-ax.ts';

/*
 * The component's accessibility subtree as a flat, pre-order list. Flat entries with depth
 * are what the diff (ADR 0003, section 3) compares; DOM identity is deliberately dropped,
 * because components often re-render nodes that mean the same thing.
 */

export type AxPropValue = string | number | boolean | null;

export interface AxEntry {
  role: string;
  name: string;
  depth: number;
  props: Record<string, AxPropValue>;
}

/** Properties whose change a user can perceive. Focus is recorded separately. */
const TRACKED_PROPS = [
  'expanded',
  'selected',
  'checked',
  'disabled',
  'invalid',
  'pressed',
  'level',
];

/** Layout fragments of text; their parent StaticText already carries the text. */
const LAYOUT_ONLY_ROLES = new Set(['InlineTextBox', 'LineBreak']);

const isTransparent = (node: RawAxNode) => {
  const role = roleOf(node);
  return node.ignored || (role === 'generic' && nameOf(node) === '') || role === 'none';
};

function propsOf(node: RawAxNode): Record<string, AxPropValue> {
  const props: Record<string, AxPropValue> = {};
  for (const name of TRACKED_PROPS) {
    const value = propertyOf(node, name)?.value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      props[name] = value;
    }
  }
  const value = node.value?.value;
  if (typeof value === 'string' || typeof value === 'number') props.value = value;
  return props;
}

/**
 * Flattens the subtree under the node backed by `rootBackendId`. Ignored and unnamed generic
 * wrappers are skipped but their children are kept, at the wrapper's depth.
 */
export function flattenSubtree(nodes: readonly RawAxNode[], rootBackendId: number): AxEntry[] {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const root = nodes.find((n) => n.backendDOMNodeId === rootBackendId);
  if (!root) return [];

  const entries: AxEntry[] = [];
  const visit = (node: RawAxNode, depth: number) => {
    const role = roleOf(node);
    if (role && LAYOUT_ONLY_ROLES.has(role)) return;
    const keep = !isTransparent(node) && role !== null;
    if (keep) entries.push({ role, name: nameOf(node), depth, props: propsOf(node) });
    for (const childId of node.childIds ?? []) {
      const child = byId.get(childId);
      if (child) visit(child, keep ? depth + 1 : depth);
    }
  };
  visit(root, 0);
  return entries;
}
