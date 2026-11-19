/*
 * Fluent 2 Menu with a plain Button as its trigger, built as the "Default" story of
 * Components/Menu (packages/react-components/react-menu/stories/src/Menu/MenuDefault.stories.tsx
 * in microsoft/fluentui, read at the tag @fluentui/react-components_v9.75.2, the measured
 * version, on 2026-11-16). A variant, not the counted target: Fluent 2 is counted with
 * MenuButton (menu-button.tsx). This is the first example a reader of the Menu docs sees, so
 * what it does is kept as evidence beside the counted system (ADR 0005, amendment of
 * 2026-11-16). Props we set, and why:
 * - Menu with positioning={{ autoSize: true }}, MenuTrigger with disableButtonEnhancement around
 *   a Button, MenuPopover, MenuList and four MenuItem, the third with `disabled`: as the story
 *   has them, word for word.
 * - Button text "Actions" instead of "Toggle menu", and the four items every menu button target
 *   gets instead of the story's four (its third is disabled as well).
 * - onClick on each MenuItem, writing the page's "Last action" line: the story's items do
 *   nothing, and the engine has to see that an item was activated.
 * - FluentProvider with webLightTheme: Fluent components need their provider and a theme.
 * Everything else is the component's default.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  FluentProvider,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  webLightTheme,
} from '@fluentui/react-components';
import { menuItems, sayLastAction } from '../../shared/menu-items.ts';

function Actions() {
  return (
    <Menu positioning={{ autoSize: true }}>
      <MenuTrigger disableButtonEnhancement>
        <Button>Actions</Button>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          {menuItems.map(({ name, isDisabled }) => (
            <MenuItem key={name} disabled={isDisabled} onClick={() => sayLastAction(name)}>
              {name}
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <FluentProvider theme={webLightTheme}>
        <Actions />
      </FluentProvider>
    </StrictMode>,
  );
}
