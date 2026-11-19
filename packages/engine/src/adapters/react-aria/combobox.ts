import type { Page } from '@playwright/test';
import type { ComboboxInteraction, ComboboxState } from '../../scenarios/combobox.ts';
import type { Adapter } from '../adapter.ts';
import { checkEmptyClosed, clicksNothing } from '../combobox/harness.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';

/** React Aria ComboBox, rendered from react-aria-components by packages/harness/react-aria. */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'Fruit' });
// Page-wide, not under the root: the popup is rendered outside the field.
const listbox = (page: Page) => page.getByRole('listbox');
const options = (page: Page) => listbox(page).getByRole('option');

export function createReactAriaComboboxAdapter(
  url: string,
): Adapter<ComboboxState, ComboboxInteraction> {
  return {
    id: 'react-aria',
    system: 'React Aria',
    version: 1,
    url,
    page: 'packages/harness/react-aria/combobox.html',
    root: harnessRoot,
    items: { locate: options, description: 'Elements with role="option" in the listbox.' },
    popup: { locate: listbox, description: 'The element with role="listbox".' },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkEmptyClosed(input, options),
    resolveClickTarget: clicksNothing,
    readVersion: readHarnessVersion,
    notes:
      'The popup is rendered outside the field. The library announces the focused option only on Apple platforms (its isAppleDevice check), so announcements were measured on the OS the provenance names.',
  };
}

export const createReactAriaComboboxTarget = () =>
  harnessTarget('react-aria', createReactAriaComboboxAdapter, 'combobox.html');
