/*
 * GitHub Primer ActionMenu, built as the "Default" story of Components/ActionMenu
 * (packages/react/src/ActionMenu/ActionMenu.stories.tsx in primer/react, read on the main branch
 * on 2026-11-16, not at the tag of the measured 38.45.0; the docs page
 * https://primer.style/product/components/action-menu/ marks the component "ready" for React).
 * This is the ActionMenu of the package's main entry, not the older one under "./deprecated".
 * Props we set, and why:
 * - ActionMenu, ActionMenu.Button, ActionMenu.Overlay with width "medium", ActionList and
 *   ActionList.Item with onSelect: as the story has them.
 * - Button text "Actions" instead of "Open menu", and the four items every menu button target
 *   gets instead of the story's four.
 * - `disabled` on the third ActionList.Item: the story has no disabled item. The package's types
 *   say of the prop: "Items that are disabled can not be clicked, selected, or navigated
 *   through." Not used: `inactiveText`, a different notion (an item whose "usual functionality
 *   is unavailable due to a system error such as a database outage"), which is not measured.
 * - onSelect writes the page's "Last action" line where the story's calls alert().
 * - ThemeProvider and BaseStyles with the light theme, as on our other Primer pages.
 * Left out of the story: the trailing shortcut hints, the divider and variant "danger" on the
 * last item, which are outside the pattern measured. Everything else is the component's default.
 */
import '@primer/primitives/dist/css/primitives.css';
import '@primer/primitives/dist/css/functional/themes/light.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ActionList, ActionMenu, BaseStyles, ThemeProvider } from '@primer/react';
import { menuItems, sayLastAction } from '../../shared/menu-items.ts';

function Actions() {
  return (
    <ActionMenu>
      <ActionMenu.Button>Actions</ActionMenu.Button>
      <ActionMenu.Overlay width="medium">
        <ActionList>
          {menuItems.map(({ name, isDisabled }) => (
            <ActionList.Item key={name} disabled={isDisabled} onSelect={() => sayLastAction(name)}>
              {name}
            </ActionList.Item>
          ))}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <BaseStyles>
          <Actions />
        </BaseStyles>
      </ThemeProvider>
    </StrictMode>,
  );
}
