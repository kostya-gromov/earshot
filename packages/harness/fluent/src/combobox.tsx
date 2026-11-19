/*
 * Fluent 2 Combobox, built as the "Filtering" story of Components/Combobox
 * (packages/react-components/react-combobox/stories/src/Combobox/ComboboxFiltering.stories.tsx in
 * microsoft/fluentui, read on the master branch on 2026-11-14, not at the tag of the measured
 * 9.75.2). The story says: "We provide useComboboxFilter() hook to filter the options based on
 * the user-typed string." Props we set, and why:
 * - query state, useComboboxFilter(query, options, { noOptionsMessage }), onOptionSelect setting
 *   the query to the option's text, onChange setting it to the typed value, value={query}, and a
 *   label joined by aria-labelledby: as the story has them, word for word.
 * - options: the six fruit every combobox target gets, as { children, value }, instead of the
 *   story's animals (one of which is disabled; none of ours is).
 * - Label "Fruit" instead of "Best pet"; noOptionsMessage "No fruit match your search."; no
 *   placeholder (the reference has none).
 * - FluentProvider with webLightTheme: Fluent components need their provider and a theme.
 * - The story's makeStyles layout is left out: it only stacks the label above the field.
 * Everything else is the component's default.
 * Not followed: the "Default" story, first in the list, where typing does not filter the options.
 * The pattern measured is list autocomplete, so the story that filters is the one that fits.
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Combobox,
  FluentProvider,
  useComboboxFilter,
  useId,
  webLightTheme,
  type ComboboxProps,
} from '@fluentui/react-components';
import { fruit } from '../../shared/fruit.ts';

const options = fruit.map((name) => ({ children: name, value: name }));

function Fruit() {
  const comboId = useId();
  const [query, setQuery] = useState<string>('');
  const children = useComboboxFilter(query, options, {
    noOptionsMessage: 'No fruit match your search.',
  });
  const onOptionSelect: ComboboxProps['onOptionSelect'] = (_, data) => {
    setQuery(data.optionText ?? '');
  };

  return (
    <div>
      <label id={comboId}>Fruit</label>
      <Combobox
        onOptionSelect={onOptionSelect}
        aria-labelledby={comboId}
        onChange={(ev) => setQuery(ev.target.value)}
        value={query}
      >
        {children}
      </Combobox>
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
