/*
 * GitHub Primer Autocomplete with a single value, built as the "Default" example on
 * https://primer.style/product/components/autocomplete/ (read 2026-11-14, @primer/react 38.45.0,
 * marked "ready" for React there). The example composes FormControl with FormControl.Label,
 * Autocomplete, Autocomplete.Input, Autocomplete.Overlay and Autocomplete.Menu. Props we set,
 * and why:
 * - Autocomplete.Menu items, selectedItemIds={[]} and aria-labelledby naming the label: the
 *   three props the example sets (all three are required). No selectionVariant, as in the
 *   example, so the menu is single selection.
 * - items: the six fruit every combobox target gets, as { text, id }, instead of the example's
 *   seven entries.
 * - FormControl.Label "Fruit" with the id the menu refers to.
 * - ThemeProvider and BaseStyles with the light theme, as on our other Primer page: Primer
 *   components need them.
 * Everything else is the component's default.
 * Not followed: "Multi-select with tokens for selected items", which uses TextInputWithTokens,
 * a component its maintainers deprecated; that pairing is what input with chips measures.
 */
import '@primer/primitives/dist/css/primitives.css';
import '@primer/primitives/dist/css/functional/themes/light.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Autocomplete, BaseStyles, FormControl, ThemeProvider } from '@primer/react';
import { fruit } from '../../shared/fruit.ts';

const items = fruit.map((name) => ({ text: name, id: name }));

function Fruit() {
  return (
    <FormControl>
      <FormControl.Label id="fruit-label">Fruit</FormControl.Label>
      <Autocomplete>
        <Autocomplete.Input />
        <Autocomplete.Overlay>
          <Autocomplete.Menu items={items} selectedItemIds={[]} aria-labelledby="fruit-label" />
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
          <Fruit />
        </BaseStyles>
      </ThemeProvider>
    </StrictMode>,
  );
}
