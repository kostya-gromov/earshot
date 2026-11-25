/*
 * Fluent 2 MenuButton opening a Menu, built as the "Default" story of Components/Button/MenuButton
 * (packages/react-components/react-button/stories/src/MenuButton/MenuButtonDefault.stories.tsx in
 * microsoft/fluentui, read at the tag @fluentui/react-components_v9.75.2, the measured version,
 * on 2026-11-16). MenuButton is the package's own component for this ("A menu button is a button
 * with a chevron icon after the text typically used to trigger a menu", MenuButtonDescription.md;
 * the Menu docs say "See also MenuButton"), and a dedicated component wins over a composition
 * (packages/engine/CLAUDE.md; 2026-11-16). Props we set, and why:
 * - Menu, MenuTrigger with disableButtonEnhancement around a MenuButton, MenuPopover, MenuList
 *   and MenuItem: as the story has them, word for word.
 * - Button text "Actions" instead of "Example", and the four items every menu button target
 *   gets instead of the story's two.
 * - `disabled` on the third MenuItem: this story has no disabled item; the prop is the one the
 *   Default story of Menu uses (`<MenuItem disabled>Open File</MenuItem>`, same tag).
 * - onClick on each MenuItem, writing the page's "Last action" line: the story's items do
 *   nothing, and the engine has to see that an item was activated.
 * - FluentProvider with webLightTheme: Fluent components need their provider and a theme.
 * Everything else is the component's default.
 * Not followed: the "Default" story of Menu, whose trigger is a plain Button (and which sets
 * positioning={{ autoSize: true }}). It was measured on 2026-11-16 before this page was changed;
 * what that recording showed is kept as an observation in the targets file and is not counted.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FluentProvider,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  webLightTheme,
} from '@fluentui/react-components';
import { menuItems, sayLastAction } from '../../shared/menu-items.ts';

function Actions() {
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton>Actions</MenuButton>
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
