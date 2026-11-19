/*
 * React Aria ComboBox with selectionMode "multiple" and a TagGroup, built as the "TagGroup" docs
 * example (https://react-aria.adobe.com/ComboBox#taggroup). The example imports the docs starter
 * wrappers (starters/docs/src/ComboBox.tsx, TagGroup.tsx, Form.tsx in adobe/react-spectrum); we
 * inline what they render, because they are not published on npm. Props we set, and why:
 * - selectionMode "multiple", ComboBoxValue rendering a TagGroup aria-label "Selected people" with
 *   onRemove updating the ComboBox state: the example's structure and handler, word for word.
 * - Tag renders a Button slot "remove" when removing is allowed: the starter Tag. Its icon is
 *   lucide's X; we draw the same "×" inline and give the button no extra name, as the starter does.
 * - Label "To" instead of "States", defaultValue with the reference's three people, items are the
 *   reference's directory, no placeholder (the reference has none).
 * - FieldButton (the chevron that opens the list) is kept, as in the example.
 * - Styles: none of the starter CSS; react-aria-components ships unstyled. Popover is unstyled too.
 * Everything else is the component's default.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  ComboBox,
  ComboBoxValue,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Tag,
  TagGroup,
  TagList,
  type Key,
} from 'react-aria-components';
import { directory, initialPeople } from '../../shared/people.ts';

const people = directory.map((name) => ({ id: name, name }));

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

function Cross() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function People() {
  return (
    <ComboBox selectionMode="multiple" defaultValue={[...initialPeople]}>
      <Label>To</Label>
      <div className="combobox-field">
        <Input className="react-aria-Input inset" />
        <Button className="field-Button">
          <Chevron />
        </Button>
      </div>
      <ComboBoxValue<(typeof people)[number]>>
        {({ selectedItems, state }) => (
          <TagGroup
            aria-label="Selected people"
            style={{ marginTop: 8 }}
            onRemove={(keys) => {
              // Remove keys from ComboBox state (the docs example's own handler).
              if (Array.isArray(state.value)) {
                state.setValue(state.value.filter((key: Key) => !keys.has(key)));
              }
            }}
          >
            <TagList
              items={selectedItems.filter((item) => item != null)}
              renderEmptyState={() => 'No selected items'}
            >
              {(item) => (
                <Tag textValue={item.name}>
                  {({ allowsRemoving }) => (
                    <>
                      {item.name}
                      {allowsRemoving && (
                        <Button slot="remove" className="remove-button">
                          <Cross />
                        </Button>
                      )}
                    </>
                  )}
                </Tag>
              )}
            </TagList>
          </TagGroup>
        )}
      </ComboBoxValue>
      <Popover className="combobox-popover">
        <ListBox items={people}>{(item) => <ListBoxItem>{item.name}</ListBoxItem>}</ListBox>
      </Popover>
    </ComboBox>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <People />
    </StrictMode>,
  );
}
