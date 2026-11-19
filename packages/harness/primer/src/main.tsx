/*
 * GitHub Primer Autocomplete with TextInputWithTokens, built as the "With token input" story on
 * primer.style (components-autocomplete-features--with-token-input, measured in M2). Deprecated by
 * Primer; shown and not counted in agreement. Props we set, and why:
 * - ThemeProvider and BaseStyles with the primitives' light theme CSS: Primer's documented setup.
 * - FormControl with a label "To" whose id labels the menu: the story's structure.
 * - tokens with onTokenRemove, and the menu's selectedItemIds with onSelectedChange and
 *   selectionVariant="multiple": the story keeps tokens in state this way.
 * - The reference's directory as items, its three starting people as tokens.
 * Everything else is the component's default.
 */
import '@primer/primitives/dist/css/primitives.css';
import '@primer/primitives/dist/css/functional/themes/light.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Autocomplete,
  BaseStyles,
  FormControl,
  TextInputWithTokens,
  ThemeProvider,
} from '@primer/react';
import { directory, initialPeople } from '../../shared/people.ts';

interface Item {
  id: string;
  text: string;
}

const items: Item[] = directory.map((name) => ({ id: name, text: name }));

function People() {
  const [tokens, setTokens] = useState(
    items.filter(({ id }) => (initialPeople as readonly string[]).includes(id)),
  );
  return (
    <FormControl>
      <FormControl.Label id="to-label">To</FormControl.Label>
      <Autocomplete>
        <Autocomplete.Input
          as={TextInputWithTokens}
          tokens={tokens}
          onTokenRemove={(id: string | number) =>
            setTokens(tokens.filter((token) => token.id !== id))
          }
          block
        />
        <Autocomplete.Overlay>
          <Autocomplete.Menu
            items={items}
            selectedItemIds={tokens.map(({ id }) => id)}
            onSelectedChange={(selected) => {
              if (Array.isArray(selected))
                setTokens(selected.map(({ id, text }) => ({ id: String(id), text: text ?? '' })));
            }}
            selectionVariant="multiple"
            aria-labelledby="to-label"
          />
        </Autocomplete.Overlay>
      </Autocomplete>
    </FormControl>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <BaseStyles>
          <People />
        </BaseStyles>
      </ThemeProvider>
    </StrictMode>,
  );
}
