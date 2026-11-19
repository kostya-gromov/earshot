/*
 * Atlassian Select with isMulti, searchable (the component's default).
 * The "Multi select" example on https://atlassian.design/components/select/examples also sets
 * isSearchable={false} and placeholder="" (read 2026-11-13). We do not follow it there: without
 * a text input the component is a multi-select dropdown, not an input with chips. So this page is
 * a configuration of the documented props, not a copy of that example.
 * Props we set, and why:
 * - isMulti: the multi-value select is Atlassian's input with chips.
 * - isSearchable is left at its default (true), which gives the text input.
 * - inputId with a <label for>: the docs pair the select with a label this way (their Label from
 *   @atlaskit/form renders a <label>; a plain one avoids a second package).
 * - options and defaultValue: the reference's directory and its three starting people.
 * Everything else is the component's default.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Select from '@atlaskit/select';
import { directory, initialPeople } from '../../shared/people.ts';

const options = directory.map((name) => ({ label: name, value: name }));
const selected = options.filter(({ value }) =>
  (initialPeople as readonly string[]).includes(value),
);

function Field() {
  return (
    <>
      <label htmlFor="to-input">To</label>
      <Select inputId="to-input" isMulti options={options} defaultValue={selected} />
    </>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Field />
    </StrictMode>,
  );
}
