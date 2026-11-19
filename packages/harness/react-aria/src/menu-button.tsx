/*
 * React Aria Menu, built as the first example on https://react-aria.adobe.com/Menu (read
 * 2026-11-16, react-aria-components 1.22.1). The example renders the docs starter wrappers,
 * which are not published on npm, so we inline what they render (starters/docs/src/Menu.tsx in
 * adobe/react-spectrum, read on the main branch on 2026-11-16): MenuTrigger around the trigger
 * Button and a Popover that holds the Menu, and MenuItem children. Props we set, and why:
 * - Button text "Actions"; the example's button has an icon and aria-label "Actions".
 * - The four items every menu button target gets, as static MenuItem children with an id.
 * - `isDisabled` on the third MenuItem, as the docs page writes a disabled item
 *   (`<MenuItem id="comments" isDisabled>`).
 * - onAction on each MenuItem, writing the page's "Last action" line, so the engine can see
 *   that an item was activated.
 * - Styles: none of the starter CSS; react-aria-components ships unstyled.
 * - The Popover has no props, as in the starter: that the open menu is modal (the rest of the
 *   page inert) is the default of react-aria-components' own Popover in the installed 1.22.1,
 *   not something the starter or this page adds.
 * Left out of the example: sections, separators, the submenu, icons and keyboard hints, which
 * are outside the pattern measured. Everything else is the component's default.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { menuItems, sayLastAction } from '../../shared/menu-items.ts';

function Actions() {
  return (
    <MenuTrigger>
      <Button>Actions</Button>
      <Popover>
        <Menu>
          {menuItems.map(({ name, isDisabled }) => (
            <MenuItem
              key={name}
              id={name}
              isDisabled={isDisabled}
              onAction={() => sayLastAction(name)}
            >
              {name}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
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
