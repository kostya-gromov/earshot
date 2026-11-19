import type { Page } from '@playwright/test';
import type { ComboboxInteraction, ComboboxState } from '../../scenarios/combobox.ts';
import type { Adapter } from '../adapter.ts';
import { checkEmptyClosed, clicksNothing } from '../combobox/harness.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';

/** Chakra UI Combobox, rendered from @chakra-ui/react by packages/harness/chakra. */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'Fruit' });
// Page-wide, not under the root: the popup is rendered outside the field.
const listbox = (page: Page) => page.getByRole('listbox');
const options = (page: Page) => listbox(page).getByRole('option');

export function createChakraComboboxAdapter(
  url: string,
): Adapter<ComboboxState, ComboboxInteraction> {
  return {
    id: 'chakra',
    system: 'Chakra UI',
    version: 1,
    url,
    page: 'packages/harness/chakra/combobox.html',
    root: harnessRoot,
    items: { locate: options, description: 'Elements with role="option" in the listbox.' },
    popup: { locate: listbox, description: 'The element with role="listbox".' },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkEmptyClosed(input, options),
    resolveClickTarget: clicksNothing,
    readVersion: readHarnessVersion,
    notes:
      'The popup is rendered in a Portal, outside the field. The page has a clear button and a trigger button beside the input, as the docs example does.',
  };
}

export const createChakraComboboxTarget = () =>
  harnessTarget('chakra', createChakraComboboxAdapter, 'combobox.html');
