import type { Page } from '@playwright/test';
import type { ChipsInteraction, ChipsState } from '../../scenarios/input-with-chips.ts';
import type { Adapter, ResolveClickResult } from '../adapter.ts';
import {
  checkStartingState,
  harnessRoot,
  harnessTarget,
  readHarnessVersion,
} from '../harness-target.ts';

/** Chakra UI v3 TagsInput (Ark UI, Zag.js), rendered from @chakra-ui/react by packages/harness/chakra. */
const input = (page: Page) => harnessRoot(page).getByRole('textbox', { name: 'To' });
// Tags have no role; each has one "Delete tag …" button, which is the per-tag handle.
// CSS: tags have no role; data-part="item" is Ark's own marker for a tag.
const tags = (page: Page) =>
  harnessRoot(page).locator('[data-scope="tags-input"][data-part="item"]');
const deleteButtons = (page: Page) =>
  harnessRoot(page).getByRole('button', { name: /^Delete tag / });

async function resolveClickTarget(page: Page, id: ChipsInteraction): Promise<ResolveClickResult> {
  if (id !== 'second-remove-control') return { ok: false, reason: 'Unknown interaction.' };
  const locator = deleteButtons(page).nth(1);
  const name = await locator.getAttribute('aria-label');
  if (!name) return { ok: false, reason: 'Second delete button has no accessible name.' };
  return { ok: true, locator, target: { role: 'button', name } };
}

export function createChakraAdapter(url: string): Adapter<ChipsState, ChipsInteraction> {
  return {
    id: 'chakra',
    system: 'Chakra UI',
    version: 2,
    url,
    page: 'packages/harness/chakra/index.html',
    root: harnessRoot,
    items: {
      locate: tags,
      description: 'Elements with Ark\'s data-part="item" marker (tags have no role).',
    },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkStartingState({ input, chips: deleteButtons, noun: 'tags' }),
    resolveClickTarget,
    readVersion: readHarnessVersion,
    notes:
      'Free-text tags input (no suggestions); tags have no role, each has a "Delete tag …" button with tabindex=-1.',
  };
}

export const createChakraTarget = () => harnessTarget('chakra', createChakraAdapter);
