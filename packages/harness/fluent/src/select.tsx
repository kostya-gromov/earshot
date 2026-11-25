/*
 * Fluent 2 Dropdown, built as the Default story (stories/src/Dropdown/DropdownDefault.stories.tsx
 * in microsoft/fluentui, react-combobox, read on the master branch on 2026-11-24; the Storybook
 * page did not render its content). Measured: @fluentui/react-components 9.75.2. The story's code
 * is a grid with a <label htmlFor={dropdownId}>, then
 *   <Dropdown id={dropdownId} placeholder="Select an animal"> <Option>…</Option> </Dropdown>
 * Props we set, and why:
 * - useId for the id, the label element linked by htmlFor, the placeholder: as the story has
 *   them; the label reads "Fruit" and the placeholder "Select a fruit".
 * - The five fruit every select target gets as Options, with Banana chosen (defaultValue and
 *   defaultSelectedOptions, which the component takes apart).
 * - FluentProvider with webLightTheme: Fluent components need their provider and a theme.
 * Everything else is the component's default.
 * Not followed: the story's disabled option ("Ferret"): disabled options are out of scope.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dropdown, FluentProvider, Option, useId, webLightTheme } from '@fluentui/react-components';
import { selectFruit, selectValue } from '../../shared/select-fruit.ts';

function Fruit() {
  const dropdownId = useId('dropdown-default');
  return (
    <div style={{ display: 'grid', justifyItems: 'start', gap: '2px', maxWidth: '400px' }}>
      <label htmlFor={dropdownId}>Fruit</label>
      <Dropdown
        id={dropdownId}
        placeholder="Select a fruit"
        defaultValue={selectValue}
        defaultSelectedOptions={[selectValue]}
      >
        {selectFruit.map((name) => (
          <Option key={name}>{name}</Option>
        ))}
      </Dropdown>
    </div>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <FluentProvider theme={webLightTheme}>
        <Fruit />
      </FluentProvider>
    </StrictMode>,
  );
}
