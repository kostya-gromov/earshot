/*
 * React Aria Select, built as the first example on https://react-aria.adobe.com/Select (read
 * 2026-11-24, react-aria-components 1.22.1). The example renders the docs starter wrapper with
 * six items and no props at the call site; the wrapper is not published on npm, so we inline what
 * the page's API section composes: Label, Button with SelectValue (and the wrapper's chevron),
 * Popover, ListBox and its items. Props we set, and why:
 * - Label "Fruit" and the five fruit every select target gets, as static ListBoxItem children,
 *   the way the example passes its items, with Banana chosen (defaultValue).
 * - Styles: none of the starter CSS; react-aria-components ships unstyled.
 * Everything else is the component's default.
 * Not followed: the page's Content section (Autocomplete inside the popover, TagGroup for
 * multiple values), which adds a search field or multiple selection.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from 'react-aria-components';
import { selectFruit, selectValue } from '../../shared/select-fruit.ts';

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
    <Select defaultValue={selectValue}>
      <Label>Fruit</Label>
      <Button>
        <SelectValue />
        <Chevron />
      </Button>
      <Popover>
        <ListBox>
          {selectFruit.map((name) => (
            <ListBoxItem key={name} id={name}>
              {name}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
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
