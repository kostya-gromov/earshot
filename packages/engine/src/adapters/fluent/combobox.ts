import type { Page } from '@playwright/test';
import type { ComboboxInteraction, ComboboxState } from '../../scenarios/combobox.ts';
import type { Adapter } from '../adapter.ts';
import { checkEmptyClosed, clicksNothing } from '../combobox/harness.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';

/** Fluent 2 Combobox with useComboboxFilter, rendered from @fluentui/react-components by packages/harness/fluent. */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'Fruit' });
// Page-wide, not under the root: the popup is rendered outside the field.
const listbox = (page: Page) => page.getByRole('listbox');
const options = (page: Page) => listbox(page).getByRole('option');

export function createFluentComboboxAdapter(
  url: string,
): Adapter<ComboboxState, ComboboxInteraction> {
  return {
    id: 'fluent',
    system: 'Fluent 2',
    version: 1,
    url,
    page: 'packages/harness/fluent/combobox.html',
    root: harnessRoot,
    items: { locate: options, description: 'Elements with role="option" in the listbox.' },
    popup: { locate: listbox, description: 'The element with role="listbox".' },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkEmptyClosed(input, options),
    resolveClickTarget: clicksNothing,
    readVersion: readHarnessVersion,
    notes:
      'The popup is rendered outside the field (the default; the docs advise inlinePopup for VoiceOver). Options are filtered by the useComboboxFilter hook, as in the Filtering story.',
  };
}

export const createFluentComboboxTarget = () =>
  harnessTarget('fluent', createFluentComboboxAdapter, 'combobox.html');
