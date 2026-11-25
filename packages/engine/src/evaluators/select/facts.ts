import type { AccessibleNode, FocusInfo, VerdictResult } from '@earshot/contracts';
import type { ObservedStep } from '../listbox-popup/facts.ts';

export * from '../listbox-popup/facts.ts';

/**
 * "The select" (select-rules.ts): the element the adapter declares as the popup's opener, read
 * from the tree around every step. Its value is read there, so a rule about the value is judged
 * even where focus has left the select.
 */
export const selectNode = (moment: ObservedStep['after']): AccessibleNode | undefined =>
  moment.popup.opener;

/** Focus is on the select: the same role and name the tree gives the opener at that moment. */
export function isOnSelect(focus: FocusInfo, select: AccessibleNode | undefined): boolean {
  if (!select || focus.isBody || focus.item) return false;
  return focus.role === select.role && focus.name === select.name;
}

/** Case and punctuation aside (WCAG 2.5.3 treats them so), with spaces collapsed. */
export const plainText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

/** The name contains the value, case and punctuation aside: the defect name-and-value owns. */
export function nameHoldsValue({ name, treeValue }: AccessibleNode): boolean {
  const value = plainText(treeValue ?? '');
  return value !== '' && plainText(name).includes(value);
}

export const hasValue = (node: AccessibleNode | undefined): boolean =>
  (node?.treeValue ?? '') !== '';

export const noOpener: VerdictResult = {
  verdict: 'inconclusive',
  summary: 'The select was not recorded',
  reason: 'The adapter did not record the select itself around the step, so its value is unknown.',
};

export const noValue: VerdictResult = {
  verdict: 'inconclusive',
  summary: 'The select exposes no value',
  reason:
    'The select exposed no value, which is charged to "A name, and the value apart from it", so there is nothing to compare here.',
};
