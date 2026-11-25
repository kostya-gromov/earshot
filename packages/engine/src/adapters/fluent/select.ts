import { harnessRoot, harnessTarget } from '../harness-target.ts';
import { createSelectHarnessAdapter } from '../select/harness.ts';

/** Fluent 2 Dropdown, rendered from @fluentui/react-components by packages/harness/fluent. */
export const createFluentSelectAdapter = (url: string) =>
  createSelectHarnessAdapter({
    id: 'fluent',
    system: 'Fluent 2',
    url,
    page: 'packages/harness/fluent/select.html',
    // The class Fluent gives the Dropdown's button slot: stable across its versions.
    select: (page) => harnessRoot(page).locator('.fui-Dropdown__button'),
    // The page's own label element, linked to the button by htmlFor and the useId id.
    label: (page) => harnessRoot(page).locator('label[for^="dropdown-default"]'),
    labelDescription:
      'The page’s label "Fruit", linked to the Dropdown by htmlFor, as in the story.',
  });

export const createFluentSelectTarget = () =>
  harnessTarget('fluent', createFluentSelectAdapter, 'select.html');
