/*
 * Atlassian Select, built as the "Single select" example on
 * https://atlassian.design/components/select/examples (read 2026-11-24, @atlaskit/select
 * 23.1.3), with search turned off. The example renders a Label from @atlaskit/form linked by
 * htmlFor and <Select inputId="single-select-example" options={…} placeholder="" />. Props we
 * set, and why:
 * - inputId, options and placeholder "": as the example; options are the five fruit every
 *   select target gets, with Banana chosen (defaultValue).
 * - isSearchable false: this pattern has no text input, and the page's own "Multi select"
 *   example sets the prop this way.
 * - A <label> "Fruit" for the input: @atlaskit/form is not installed, and the docs ask for a
 *   visible label outside the field.
 * Everything else is the component's default.
 * Not followed: the first example on the page, "Async select", which loads its options.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Select from '@atlaskit/select';
import { selectFruit, selectValue } from '../../shared/select-fruit.ts';

const options = selectFruit.map((name) => ({ label: name, value: name }));
const chosen = options.find(({ value }) => value === selectValue);

function Fruit() {
  return (
    <div>
      <label htmlFor="fruit-input">Fruit</label>
      <Select
        inputId="fruit-input"
        options={options}
        placeholder=""
        isSearchable={false}
        defaultValue={chosen}
      />
    </div>
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
