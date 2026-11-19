/*
 * Atlassian Select with a single value, built as the "Single select" example on
 * https://atlassian.design/components/select/examples (read 2026-11-14, @atlaskit/select 23.1.3):
 * "Allows the user to select a single item from a dropdown list of options." The example's code
 * sets inputId, testId, options and placeholder="". Props we set, and why:
 * - inputId and options: as the example; options are the six fruit every combobox target gets,
 *   as { label, value }, instead of the example's cities.
 * - placeholder="": as the example.
 * - A <label> for the input, "Fruit": the example renders its own label; the docs ask for a
 *   field label instead of placeholder text.
 * - testId is left out: it only serves the example's tests.
 * Everything else is the component's default. The default is a searchable select: in the
 * package (@atlaskit/react-select 4.12.10, select.js) isSearchable defaults to true and the
 * input has role "combobox". The docs call the component a select with a dropdown list, never a
 * combobox.
 * Not followed: "Async select", first on the page, which loads its options from a function.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Select from '@atlaskit/select';
import { fruit } from '../../shared/fruit.ts';

const options = fruit.map((name) => ({ label: name, value: name.toLowerCase() }));

function Fruit() {
  return (
    <>
      <label htmlFor="fruit-input">Fruit</label>
      <Select inputId="fruit-input" options={options} placeholder="" />
    </>
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
