import type { Page } from '@playwright/test';
import type { ComboboxInteraction, ComboboxState } from '../../scenarios/combobox.ts';
import type { Adapter } from '../adapter.ts';
import { checkEmptyClosed, clicksNothing } from '../combobox/harness.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';

/** Atlassian Select, single value, rendered from @atlaskit/select by packages/harness/atlassian. */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'Fruit' });
// Page-wide, not under the root: the popup is rendered outside the field.
const listbox = (page: Page) => page.getByRole('listbox');
const options = (page: Page) => listbox(page).getByRole('option');

export function createAtlassianComboboxAdapter(
  url: string,
): Adapter<ComboboxState, ComboboxInteraction> {
  return {
    id: 'atlassian',
    system: 'Atlassian',
    version: 1,
    url,
    page: 'packages/harness/atlassian/combobox.html',
    root: harnessRoot,
    items: { locate: options, description: 'Elements with role="option" in the listbox.' },
    popup: { locate: listbox, description: 'The element with role="listbox".' },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkEmptyClosed(input, options),
    resolveClickTarget: clicksNothing,
    readVersion: readHarnessVersion,
    notes:
      'The docs call the component a select with a dropdown list; its input has role combobox and filters by default.',
  };
}

export const createAtlassianComboboxTarget = () =>
  harnessTarget('atlassian', createAtlassianComboboxAdapter, 'combobox.html');
