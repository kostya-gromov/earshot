import type { Page } from '@playwright/test';
import type { SelectInteraction, SelectStart } from '../../scenarios/select.ts';
import type { Adapter, SetupResult } from '../adapter.ts';
import { readReferenceVersion } from '../reference.ts';

// By element, not by role and name: the name is what the engine is there to record.
const select = (page: Page) => page.locator('[data-select] [role="combobox"]');
/** Hidden while closed, so it is found only while it is in the accessibility tree. */
const listbox = (page: Page) => page.getByRole('listbox', { name: 'Fruit' });

/**
 * The options and the value Banana come from the page (index.html); setup checks what it can see
 * without touching the component, then puts focus where the scenario starts.
 */
async function setupReference(page: Page, state: SelectStart): Promise<SetupResult> {
  if ((await select(page).textContent()) !== 'Banana') {
    return { ok: false, reason: 'Expected the value Banana.' };
  }
  if ((await select(page).getAttribute('aria-expanded')) !== 'false') {
    return { ok: false, reason: 'Expected a closed list.' };
  }
  const start = state.focus === 'select' ? select(page) : page.locator('#email');
  await start.focus();
  return {
    ok: true,
    actualStateDescription: `Value Banana, list closed, focus on ${state.focus === 'select' ? 'the select' : 'the field before the select'}`,
  };
}

/** The local reference select, served by @earshot/reference's static server. */
export function createSelectReferenceAdapter(
  baseUrl: string,
): Adapter<SelectStart, SelectInteraction> {
  return {
    id: 'reference',
    system: 'Reference',
    version: 1,
    url: new URL('/select/', baseUrl).href,
    page: 'packages/reference/select/index.html',
    root: (page) => page.locator('[data-select]'),
    items: {
      locate: (page) => listbox(page).getByRole('option'),
      description: 'Options in the listbox "Fruit".',
    },
    popup: {
      locate: listbox,
      description:
        'The listbox "Fruit"; the select that opens it is the element with role combobox.',
      opener: select,
    },
    label: {
      locate: (page) => page.locator('#fruit-label'),
      description: 'The text "Fruit" above the select.',
    },
    ready: async (page) => {
      // index.html marks the select once createSelect has run.
      await page.locator('[data-select][data-ready="true"]').waitFor();
    },
    setup: setupReference,
    resolveClickTarget: () =>
      Promise.resolve({ ok: false, reason: 'The select scenarios click nothing.' }),
    readVersion: readReferenceVersion,
  };
}
