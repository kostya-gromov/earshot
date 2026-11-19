/*
 * React Aria TokenField as the input of a ComboBox, built as the "ComboBox" example on the
 * TokenField docs page (https://react-aria.adobe.com/TokenField: "Use TokenField as the input for a
 * ComboBox to build a multi-select field with tokens"). TokenField ships in react-aria-components
 * at the measured version. The example imports the docs starter wrappers (starters/docs/src/
 * TokenField.tsx, ComboBox.tsx, Form.tsx, Popover.tsx in adobe/react-spectrum) and a local class
 * file; neither is published on npm, so what they render is written out here and the class is
 * copied word for word (combo-box-token-field-value.ts). Props we set, and why:
 * - ComboBox selectionMode "multiple" with value, inputValue and onChange from the
 *   ComboBoxTokenFieldValue: the example's wiring, word for word.
 * - TokenField value and onChange, TokenInput with the starter's class name, Token rendering
 *   segment.text: the example and its TokenField wrapper.
 * - The starting value holds the reference's three people as tokens (the example starts empty);
 *   each token's value is its key, as the class's own setSelectedKeys writes them.
 * - Label "To" instead of "Users", items are the reference's directory, no placeholder (the
 *   reference has none), no width style (the page sets the width).
 * - FieldButton (the chevron that opens the list) is kept, as in the example. Popover without
 *   the arrow, as the example's hideArrow.
 * - Styles: none of the starter CSS; react-aria-components ships unstyled.
 * Everything else is the component's default.
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ComboBox, Label, ListBox, ListBoxItem, Popover } from 'react-aria-components';
import { Token, TokenField, TokenInput } from 'react-aria-components/TokenField';
import { directory, initialPeople } from '../../shared/people.ts';
import { ComboBoxTokenFieldValue } from './combo-box-token-field-value.ts';

const people = directory.map((name) => ({ id: name, name }));

const startingValue = () =>
  new ComboBoxTokenFieldValue(
    initialPeople.map((name) => ({ type: 'token' as const, text: name, value: name })),
  );

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

function People() {
  const [value, setValue] = useState(startingValue);
  return (
    <ComboBox
      selectionMode="multiple"
      value={value.getSelectedKeys()}
      inputValue={value.getInputValue()}
      onChange={(keys) => setValue(value.setSelectedKeys(keys))}
    >
      <Label>To</Label>
      <div className="combobox-field">
        <TokenField value={value} onChange={setValue}>
          <TokenInput className="react-aria-TokenInput inset">
            {(segment) => <Token>{segment.text}</Token>}
          </TokenInput>
        </TokenField>
        <Button className="field-Button">
          <Chevron />
        </Button>
      </div>
      <Popover className="react-aria-Popover combobox-popover">
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
