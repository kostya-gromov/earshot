/*
 * Atlassian Dropdown menu, built as the "Default" example under Appearance on
 * https://atlassian.design/components/dropdown-menu/examples (read 2026-11-16,
 * @atlaskit/dropdown-menu 21.3.2). Props we set, and why:
 * - DropdownMenu with a string trigger and shouldRenderToParent, around one DropdownItemGroup
 *   of DropdownItem children: as the example has them.
 * - trigger "Actions" instead of "Page actions", and the four items every menu button target
 *   gets instead of the example's six.
 * - `isDisabled` on the third DropdownItem: the example has no disabled item; the prop is the
 *   one the DropdownItem code page documents ("Makes the element appear disabled. This will
 *   remove interactivity and the item won't appear in the focus order.").
 * - onClick on each DropdownItem, writing the page's "Last action" line: the example's items do
 *   nothing, and the engine has to see that an item was activated.
 * - Imported from the package root; the example imports each part from its own entry point
 *   (`@atlaskit/dropdown-menu/dropdown-item` and so on), which are the same components.
 * Everything else is the component's default.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import { menuItems, sayLastAction } from '../../shared/menu-items.ts';

function Actions() {
  return (
    <DropdownMenu trigger="Actions" shouldRenderToParent>
      <DropdownItemGroup>
        {menuItems.map(({ name, isDisabled }) => (
          <DropdownItem key={name} isDisabled={isDisabled} onClick={() => sayLastAction(name)}>
            {name}
          </DropdownItem>
        ))}
      </DropdownItemGroup>
    </DropdownMenu>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Actions />
    </StrictMode>,
  );
}
