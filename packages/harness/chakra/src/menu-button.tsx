/*
 * Chakra UI Menu, built as the "Basic" docs example (https://chakra-ui.com/docs/components/menu).
 * Its code is apps/compositions/src/examples/menu-basic.tsx in chakra-ui/chakra-ui, read on the
 * main branch on 2026-11-16 (not at the tag of the measured 3.38.0). Props we set, and why:
 * - Menu.Root, Menu.Trigger asChild around a Button with variant "outline" and size "sm", Portal,
 *   Menu.Positioner, Menu.Content and Menu.Item with a value: as the example has them.
 * - Button text "Actions" instead of "Open", and the four items every menu button target gets
 *   instead of the example's five.
 * - `disabled` on the third Menu.Item: the example has no disabled item; the prop is the one
 *   the docs page lists for Menu.Item ("Whether the menu item is disabled").
 * - onSelect on each Menu.Item, writing the page's "Last action" line: the example's items do
 *   nothing, and the engine has to see that an item was activated.
 * - ChakraProvider with defaultSystem: Chakra components need their provider and a system.
 * Everything else is the component's default, loopFocus (false) included.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ChakraProvider, Menu, Portal, defaultSystem } from '@chakra-ui/react';
import { menuItems, sayLastAction } from '../../shared/menu-items.ts';

function Actions() {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="outline" size="sm">
          Actions
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {menuItems.map(({ name, isDisabled }) => (
              <Menu.Item
                key={name}
                value={name.toLowerCase()}
                disabled={isDisabled}
                onSelect={() => sayLastAction(name)}
              >
                {name}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ChakraProvider value={defaultSystem}>
        <Actions />
      </ChakraProvider>
    </StrictMode>,
  );
}
