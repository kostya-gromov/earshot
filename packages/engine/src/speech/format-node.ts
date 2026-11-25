import type { AccessibleNode } from '@earshot/contracts';

function stateWords({ states }: AccessibleNode): string[] {
  const words: string[] = [];
  if (states.expanded !== undefined) words.push(states.expanded ? 'expanded' : 'collapsed');
  if (states.selected) words.push('selected');
  if (states.checked !== undefined) {
    words.push(states.checked === 'mixed' ? 'mixed' : states.checked ? 'checked' : 'not checked');
  }
  if (states.disabled) words.push('unavailable');
  if (states.invalid) words.push('invalid entry');
  return words;
}

/**
 * Name, role, value, the popup it says it has, position, states: one order and one wording for
 * every system. "has popup menu" is said only for an aria-haspopup the element itself carries.
 * The value is a combobox's (engine 0.21.0): a select that said only "Fruit, combobox" would hide
 * what is chosen.
 */
export function formatNodeSpeech(node: AccessibleNode): string {
  const parts: string[] = [];
  if (node.name) parts.push(node.name);
  if (node.role) parts.push(node.role);
  if (node.treeValue) parts.push(node.treeValue);
  if (node.states.hasPopup) parts.push(`has popup ${node.states.hasPopup}`);
  if (node.posInSet !== undefined && node.setSize !== undefined) {
    parts.push(`${node.posInSet} of ${node.setSize}`);
  }
  parts.push(...stateWords(node));
  return parts.join(', ');
}
