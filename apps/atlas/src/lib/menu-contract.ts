import type { Step } from '@earshot/contracts';
import type { ContractPart } from './behavior-contract';
import { menuSteps, type MenuMoment } from './menu-replay';

const quote = (text: string) => `“${text}”`;
const plain = (text: string): ContractPart => ({ text, kind: 'plain' });

/** Where focus is once the menu is not shown: the button, another control, or nowhere. */
function closedParts({ focus }: MenuMoment): ContractPart[] {
  switch (focus.kind) {
    case 'button':
      return [plain('menu closed, focus on the button')];
    case 'outside':
      return [
        plain('menu closed, focus leaves to '),
        { text: quote(focus.name || focus.role || 'a control'), kind: 'focus' },
      ];
    case 'body':
      return [plain('menu closed, focus falls to the document')];
    case 'item':
    case 'menu':
      return [plain('menu closed')];
  }
}

function openParts({ items }: MenuMoment): ContractPart[] {
  const index = items.findIndex(({ isActive }) => isActive);
  const item = items[index];
  if (!item) return [plain(`menu open, ${items.length} items, none active`)];
  return [
    plain('menu open, active '),
    { text: quote(item.name), kind: 'focus' },
    plain(`, ${index + 1} of ${items.length}${item.isDisabled ? ', disabled' : ''}`),
  ];
}

/**
 * What a step of a menu button recording led to: the menu and its active item, or where focus is
 * once the menu is gone, and what the page says ran. Undefined for a step of another pattern.
 */
export function menuOutcomeParts(step: Step): ContractPart[] | undefined {
  const [menu] = menuSteps([step]);
  if (!menu) return undefined;
  const { before, after } = menu;
  const state = after.items.length > 0 ? openParts(after) : closedParts(after);
  if (after.lastAction === before.lastAction) return state;
  // The page's own line, written by the item's handler: the action ran.
  return [...state, plain(`, page says ${quote(after.lastAction)}`)];
}
