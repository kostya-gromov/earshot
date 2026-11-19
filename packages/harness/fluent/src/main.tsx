/*
 * Fluent 2 TagPicker, built as the "Default" story on react.fluentui.dev (the page we measured in
 * M2, components-tagpicker--default). Props we set, and why:
 * - FluentProvider with webLightTheme: Fluent components need their provider and a theme.
 * - Field label "To", TagPickerGroup aria-label "Selected people", TagPickerInput aria-label
 *   "To": the story's structure, with the reference's names instead of "Select Employees".
 * - selectedOptions with onOptionSelect: the story keeps selection in state this way, and
 *   removing a tag is an option select.
 * - Options are the reference's directory minus the selected people, as the story filters them.
 * Everything else is the component's default.
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Avatar,
  Field,
  FluentProvider,
  Tag,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  webLightTheme,
} from '@fluentui/react-components';
import { directory, initialPeople } from '../../shared/people.ts';

function People() {
  const [selected, setSelected] = useState<string[]>([...initialPeople]);
  const options = directory.filter((name) => !selected.includes(name));
  return (
    <Field label="To">
      <TagPicker
        selectedOptions={selected}
        onOptionSelect={(_, data) => setSelected(data.selectedOptions)}
      >
        <TagPickerControl>
          <TagPickerGroup aria-label="Selected people">
            {selected.map((name) => (
              <Tag
                key={name}
                shape="rounded"
                media={<Avatar aria-hidden name={name} color="colorful" />}
                value={name}
              >
                {name}
              </Tag>
            ))}
          </TagPickerGroup>
          <TagPickerInput aria-label="To" />
        </TagPickerControl>
        <TagPickerList>
          {options.map((name) => (
            <TagPickerOption
              key={name}
              media={<Avatar shape="square" aria-hidden name={name} color="colorful" />}
              value={name}
            >
              {name}
            </TagPickerOption>
          ))}
        </TagPickerList>
      </TagPicker>
    </Field>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <FluentProvider theme={webLightTheme}>
        <People />
      </FluentProvider>
    </StrictMode>,
  );
}
