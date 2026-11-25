import type { Locator, Page } from '@playwright/test';
import type { SelectInteraction, SelectStart } from '../../scenarios/select.ts';
import type { Adapter, SetupResult } from '../adapter.ts';
import { harnessRoot, readHarnessVersion } from '../harness-target.ts';

/** What differs between systems on a select harness page: where the select and its label are. */
export interface SelectHarnessParts {
  id: string;
  system: string;
  url: string;
  page: string;
  /** The element that holds focus while the list is closed; found by element, not by name. */
  select: (page: Page) => Locator;
  /** The element that shows the label "Fruit". */
  label: (page: Page) => Locator;
  labelDescription: string;
  /** Where the page shows the chosen value, when it is not the select's own text (Atlassian). */
  shownValue?: (page: Page) => Locator;
  notes?: string;
}

// Page-wide, not under the root: a system is free to render its list anywhere.
const listbox = (page: Page) => page.getByRole('listbox');
const options = (page: Page) => listbox(page).getByRole('option');

/**
 * The options and the value are set through the component's props, so setup checks what it can
 * see without touching the component (the value on screen, no options shown), then puts focus
 * where the scenario starts: the select, or the field before it.
 */
function checkStart({ select, shownValue = select }: SelectHarnessParts) {
  return async (page: Page, state: SelectStart): Promise<SetupResult> => {
    const shown = (await shownValue(page).innerText()).trim();
    if (!shown.includes('Banana')) {
      return { ok: false, reason: `Expected the value Banana on screen, found "${shown}".` };
    }
    if ((await options(page).count()) > 0) return { ok: false, reason: 'The list is open.' };
    const onSelect = state.focus === 'select';
    await (onSelect ? select(page) : page.locator('#email')).focus();
    return {
      ok: true,
      actualStateDescription: `Value Banana, list closed, focus on ${onSelect ? 'the select' : 'the field before the select'}`,
    };
  };
}

export function createSelectHarnessAdapter(
  parts: SelectHarnessParts,
): Adapter<SelectStart, SelectInteraction> {
  return {
    id: parts.id,
    system: parts.system,
    version: 1,
    url: parts.url,
    page: parts.page,
    root: harnessRoot,
    items: { locate: options, description: 'Elements with role="option" in the listbox.' },
    popup: {
      locate: listbox,
      description: 'The element with role="listbox"; the select is the element that opens it.',
      opener: parts.select,
    },
    label: { locate: parts.label, description: parts.labelDescription },
    ready: (page) => parts.select(page).waitFor({ timeout: 20_000 }),
    setup: checkStart(parts),
    resolveClickTarget: () =>
      Promise.resolve({ ok: false, reason: 'The select scenarios click nothing.' }),
    readVersion: readHarnessVersion,
    ...(parts.notes ? { notes: parts.notes } : {}),
  };
}
