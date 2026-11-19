import type { Page } from '@playwright/test';
import type { ComboboxInteraction, ComboboxState } from '../../scenarios/combobox.ts';
import type { Adapter } from '../adapter.ts';
import { checkEmptyClosed, clicksNothing } from '../combobox/harness.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';

/** MUI Autocomplete with a single value, rendered from @mui/material by packages/harness/mui. */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'Fruit' });
// Page-wide, not under the root: a system is free to render its popup anywhere.
const listbox = (page: Page) => page.getByRole('listbox');
const options = (page: Page) => listbox(page).getByRole('option');

export function createMuiComboboxAdapter(url: string): Adapter<ComboboxState, ComboboxInteraction> {
  return {
    id: 'mui',
    system: 'MUI',
    version: 1,
    url,
    page: 'packages/harness/mui/combobox.html',
    root: harnessRoot,
    items: { locate: options, description: 'Elements with role="option" in the listbox.' },
    popup: { locate: listbox, description: 'The element with role="listbox".' },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkEmptyClosed(input, options),
    resolveClickTarget: clicksNothing,
    readVersion: readHarnessVersion,
    notes:
      'The page follows the docs "Combo box" example, which sets disablePortal, so the popup is inside the field. With no matching option MUI shows "No options" in a status region and no listbox.',
  };
}

export const createMuiComboboxTarget = () =>
  harnessTarget('mui', createMuiComboboxAdapter, 'combobox.html');
