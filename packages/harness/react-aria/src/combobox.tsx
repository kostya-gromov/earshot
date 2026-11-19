/*
 * React Aria ComboBox with a single value, built as the first example on
 * https://react-aria.adobe.com/ComboBox (read 2026-11-14, react-aria-components 1.22.1). The
 * example renders the docs starter wrapper with six items and no props at the call site; the
 * wrapper is not published on npm, so we inline what it renders: Label, Input, the trigger
 * Button with a chevron, Popover, ListBox and its items (the structure the page's API section
 * gives). Props we set, and why:
 * - Label "Fruit" and the six fruit every combobox target gets, as static ListBoxItem children,
 *   the way the example passes its items.
 * - The trigger Button is kept, as in the example.
 * - Styles: none of the starter CSS; react-aria-components ships unstyled.
 * Everything else is the component's default, menuTrigger "input" included ("popover opens when
 * the user edits the input text").
 * Not followed: Autocomplete, which the docs give for filtering a collection or text completions,
 * not for choosing a value from a set.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from 'react-aria-components';
import { fruit } from '../../shared/fruit.ts';

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Fruit() {
  return (
    <ComboBox>
      <Label>Fruit</Label>
      <div className="combobox-field">
        <Input />
        <Button>
          <Chevron />
        </Button>
      </div>
      <Popover>
        <ListBox>
          {fruit.map((name) => (
            <ListBoxItem key={name} id={name}>
              {name}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Fruit />
    </StrictMode>,
  );
}
