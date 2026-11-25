import { harnessRoot, harnessTarget } from '../harness-target.ts';
import { createSelectHarnessAdapter } from '../select/harness.ts';

/** MUI Select, rendered from @mui/material by packages/harness/mui (select.html). */
export const createMuiSelectAdapter = (url: string) =>
  createSelectHarnessAdapter({
    id: 'mui',
    system: 'MUI',
    url,
    page: 'packages/harness/mui/select.html',
    // By id: the page sets id="fruit-select" on the Select, as the docs example does.
    select: (page) => harnessRoot(page).locator('#fruit-select'),
    label: (page) => harnessRoot(page).locator('#fruit-select-label'),
    labelDescription: 'The InputLabel "Fruit", linked to the Select by labelId.',
  });

export const createMuiSelectTarget = () =>
  harnessTarget('mui', createMuiSelectAdapter, 'select.html');
