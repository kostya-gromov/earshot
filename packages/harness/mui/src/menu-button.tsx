/*
 * MUI Menu opened by a Button, built as the "Basic menu" docs demo
 * (https://mui.com/material-ui/react-menu/; its code is
 * docs/data/material/components/menus/BasicMenu.tsx in mui/material-ui, read at the tag v9.5.0,
 * the measured version, on 2026-11-16; on the master branch the same file has moved to
 * menus/demos/basic/ with the same code). Material UI documents no
 * ready-made menu button: the demo wires a Button to a Menu itself, and so does this page
 * (ADR 0006). Props we set, and why:
 * - useId for the two ids; anchorEl state; on the Button: id, aria-controls while open,
 *   aria-haspopup="true", aria-expanded={open}, onClick setting the anchor; on the Menu: id,
 *   anchorEl, open, onClose, slotProps.list['aria-labelledby']: as the demo has them, word for
 *   word. The button's expanded state on this page is therefore the demo's wiring, written by
 *   the page: `aria-expanded={open}` is true or false, never left out.
 * - Button text "Actions" instead of "Dashboard", and the four items every menu button target
 *   gets instead of the demo's three.
 * - `disabled` on the third MenuItem: the demo has no disabled item; the prop is MenuItem's own
 *   ("If `true`, the component is disabled").
 * - onClick on each MenuItem writes the page's "Last action" line and then closes, where the
 *   demo's only closes: the engine has to see that an item was activated.
 * Everything else is the component's default.
 */
import { StrictMode, useId, useState, type MouseEvent } from 'react';
import { createRoot } from 'react-dom/client';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { menuItems, sayLastAction } from '../../shared/menu-items.ts';

function Actions() {
  const id = useId();
  const buttonId = `${id}-button`;
  const menuId = `${id}-menu`;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        id={buttonId}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={handleClick}
      >
        Actions
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': buttonId,
          },
        }}
      >
        {menuItems.map(({ name, isDisabled }) => (
          <MenuItem
            key={name}
            disabled={isDisabled}
            onClick={() => {
              sayLastAction(name);
              handleClose();
            }}
          >
            {name}
          </MenuItem>
        ))}
      </Menu>
    </div>
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
