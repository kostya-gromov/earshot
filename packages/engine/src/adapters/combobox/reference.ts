import type { Page } from '@playwright/test';
import type { ComboboxInteraction, ComboboxState } from '../../scenarios/combobox.ts';
import type { Adapter, SetupResult } from '../adapter.ts';
import { readReferenceVersion } from '../reference.ts';
import { clicksNothing } from './harness.ts';

const input = (page: Page) => page.getByRole('combobox', { name: 'Fruit' });
/** Hidden while closed, so it is found only while it is in the accessibility tree. */
const listbox = (page: Page) => page.getByRole('listbox', { name: 'Fruit' });

/**
 * The reference renders its options only while the popup is open, so the six options come from
 * the page (index.html) and setup checks the rest: empty, closed, focused.
 */
async function setupReference(page: Page): Promise<SetupResult> {
  if ((await input(page).inputValue()) !== '')
    return { ok: false, reason: 'Expected an empty combobox.' };
  if ((await input(page).getAttribute('aria-expanded')) !== 'false') {
    return { ok: false, reason: 'Expected a closed popup.' };
  }
  await input(page).focus();
  return { ok: true, actualStateDescription: 'empty combobox focused, popup closed' };
}

/** The local reference combobox, served by @earshot/reference's static server. */
export function createComboboxReferenceAdapter(
  baseUrl: string,
): Adapter<ComboboxState, ComboboxInteraction> {
  return {
    id: 'reference',
    system: 'Reference',
    version: 1,
    url: new URL('/combobox/', baseUrl).href,
    page: 'packages/reference/combobox/index.html',
    root: (page) => page.locator('[data-combobox]'),
    items: {
      locate: (page) => listbox(page).getByRole('option'),
      description: 'Options in the listbox "Fruit".',
    },
    popup: { locate: listbox, description: 'The listbox "Fruit".' },
    ready: async (page) => {
      // index.html marks the combobox once createCombobox has run.
      await page.locator('[data-combobox][data-ready="true"]').waitFor();
    },
    setup: setupReference,
    resolveClickTarget: clicksNothing,
    readVersion: readReferenceVersion,
  };
}
