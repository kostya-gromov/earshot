import type { Page } from '@playwright/test';
import type { SelectInteraction, SelectStart } from '../../scenarios/select.ts';
import type { Adapter, SetupResult } from '../adapter.ts';
import { readReferenceVersion } from '../reference.ts';

// By element: a native select is found by its id, and its name is what is recorded.
const select = (page: Page) => page.locator('#fruit');
/**
 * The list counts as shown only while the select matches :open. Its option elements are in the
 * tree whether the list is shown or not, so taking the select itself for the list read a closed
 * select as collapsed beside five options (first run of 2026-11-25): a false difference.
 */
const shownList = (page: Page) => page.locator('#fruit:open');

async function setupNative(page: Page, state: SelectStart): Promise<SetupResult> {
  if ((await select(page).inputValue()) !== 'Banana') {
    return { ok: false, reason: 'Expected the value Banana.' };
  }
  const onSelect = state.focus === 'select';
  await (onSelect ? select(page) : page.locator('#email')).focus();
  return {
    ok: true,
    actualStateDescription: `Value Banana, list closed, focus on ${onSelect ? 'the select' : 'the field before the select'}`,
  };
}

/**
 * The browser's own select (packages/reference/select/native.html), measured as evidence for the
 * draft requirement native-select-first, never counted (data/targets.yaml). The browser draws its
 * list; what the tree exposes of it is recorded as it is. The popup is the select while it is
 * open (shownList).
 */
export function createNativeSelectAdapter(
  baseUrl: string,
): Adapter<SelectStart, SelectInteraction> {
  return {
    id: 'native-select',
    system: 'Reference',
    version: 1,
    url: new URL('/select/native.html', baseUrl).href,
    page: 'packages/reference/select/native.html',
    root: (page) => page.locator('[data-native-select]'),
    items: {
      locate: (page) => shownList(page).locator('option'),
      description: 'The option elements of the select "Fruit", while its list is shown.',
    },
    popup: {
      locate: shownList,
      description:
        'The select element while it matches :open, whose options the browser draws as its list.',
      opener: select,
    },
    label: {
      locate: (page) => page.locator('label[for="fruit"]'),
      description: 'The label "Fruit" above the select.',
    },
    ready: (page) => select(page).waitFor(),
    setup: setupNative,
    resolveClickTarget: () =>
      Promise.resolve({ ok: false, reason: 'The select scenarios click nothing.' }),
    readVersion: readReferenceVersion,
    // Every scenario that opens the list and then presses more keys: once the browser draws its
    // list, the engine's keys do not reach it (measured 2026-11-24, Chromium on macOS). Run: the
    // Tab into the closed select, Space, and a letter typed on the closed select.
    notRun: {
      scenarios: ['open', 'move', 'enter', 'escape', 'tab-open', 'optional-keys', 'typeahead'],
      reason: "Not run: the engine cannot drive the browser's own list.",
    },
  };
}
