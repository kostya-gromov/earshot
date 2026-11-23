import type { AccessibleNode, AccessibleStates } from '@earshot/contracts';

/*
 * The parts of a Chromium CDP `Accessibility.AXNode` the engine reads. Declared here,
 * structurally, so the pure core does not depend on Playwright or protocol typings.
 */

export interface RawAxValue {
  type?: string;
  value?: unknown;
  relatedNodes?: { backendDOMNodeId: number }[];
}

export interface RawAxNode {
  nodeId: string;
  ignored: boolean;
  role?: RawAxValue;
  name?: RawAxValue;
  description?: RawAxValue;
  value?: RawAxValue;
  properties?: { name: string; value: RawAxValue }[];
  parentId?: string;
  childIds?: string[];
  backendDOMNodeId?: number;
}

export const roleOf = (node: RawAxNode): string | null =>
  typeof node.role?.value === 'string' ? node.role.value : null;

export const nameOf = (node: RawAxNode): string =>
  typeof node.name?.value === 'string' ? node.name.value : '';

export function propertyOf(node: RawAxNode, name: string): RawAxValue | undefined {
  return node.properties?.find((p) => p.name === name)?.value;
}

const asBoolean = (value: RawAxValue | undefined): boolean | undefined => {
  if (value?.value === undefined) return undefined;
  return value.value === true || value.value === 'true';
};

/** Chromium reports `checked` as a tristate string: "true", "false" or "mixed". */
const asTristate = (value: RawAxValue | undefined): boolean | 'mixed' | undefined =>
  value?.value === 'mixed' ? 'mixed' : asBoolean(value);

/** Chromium reports `invalid` as a token: "false", "true", "grammar" or "spelling". */
const asInvalid = (value: RawAxValue | undefined): boolean | undefined =>
  value?.value === undefined ? undefined : value.value !== 'false' && value.value !== false;

/** Keeps only the keys that have a value (the contract uses exact optional properties). */
function definedOnly<T extends object>(record: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}

function statesOf(node: RawAxNode): AccessibleStates {
  const read = (name: string) => propertyOf(node, name);
  return definedOnly({
    expanded: asBoolean(read('expanded')),
    selected: asBoolean(read('selected')),
    checked: asTristate(read('checked')),
    disabled: asBoolean(read('disabled')),
    invalid: asInvalid(read('invalid')),
    modal: asBoolean(read('modal')),
  });
}

/** Maps a CDP node to the contract's AccessibleNode, without position (see set-position.ts). */
export function toAccessibleNode(node: RawAxNode): AccessibleNode {
  const description = typeof node.description?.value === 'string' ? node.description.value : '';
  return {
    role: roleOf(node),
    name: nameOf(node),
    ...(description ? { description } : {}),
    states: statesOf(node),
  };
}
