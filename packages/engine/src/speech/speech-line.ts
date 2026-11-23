import type { AccessibleNode, Announcement, FocusInfo } from '@earshot/contracts';
import { isSameElement } from '../model/same-element.ts';
import { formatNodeSpeech } from './format-node.ts';

export interface SpeechInput {
  documentTitle: string;
  focusBefore: FocusInfo;
  focusAfter: FocusInfo;
  announcements: readonly Announcement[];
}

function nodeKey(node: AccessibleNode | undefined): string {
  if (!node) return '';
  const { states } = node;
  return [
    node.role,
    node.name,
    node.description,
    node.posInSet,
    node.setSize,
    states.expanded,
    states.selected,
    states.checked,
    states.disabled,
    states.invalid,
  ].join('\u0000');
}

/**
 * Focus that lands on an element which already names an active descendant says both: the
 * element, then the item it points at. A menu that takes focus itself and marks its first item
 * with aria-activedescendant would otherwise read as the menu alone (Chakra UI, 2026-11-16).
 */
function landedOn(focusAfter: FocusInfo): string[] {
  const element = formatNodeSpeech(focusAfter);
  const { activeDescendant } = focusAfter;
  return activeDescendant ? [element, formatNodeSpeech(activeDescendant)] : [element];
}

function focusLines({ documentTitle, focusBefore, focusAfter }: SpeechInput): string[] {
  // Focus left the page: the model reads what focus lands on in the page's tree, and there is
  // nothing of the page to read. No line, not the document's (engine 0.20.0).
  if (focusAfter.leftPage) return [];
  if (!isSameElement(focusBefore, focusAfter)) {
    if (!focusAfter.isBody) return landedOn(focusAfter);
    const title = documentTitle.trim();
    return [title ? `${title}, document` : 'document'];
  }
  if (nodeKey(focusBefore.activeDescendant) === nodeKey(focusAfter.activeDescendant)) return [];
  return focusAfter.activeDescendant ? [formatNodeSpeech(focusAfter.activeDescendant)] : [];
}

export function synthesizeSpeech(input: SpeechInput): string[] {
  const assertive = input.announcements
    .filter(({ politeness }) => politeness === 'assertive')
    .map(({ text }) => text);
  const polite = input.announcements
    .filter(({ politeness }) => politeness === 'polite')
    .map(({ text }) => text);
  return [...assertive, ...focusLines(input), ...polite];
}
