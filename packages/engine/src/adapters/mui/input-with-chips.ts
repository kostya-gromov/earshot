import type { Page } from '@playwright/test';
import type { ChipsInteraction, ChipsState } from '../../scenarios/input-with-chips.ts';
import type { Adapter, ResolveClickResult } from '../adapter.ts';
import {
  checkStartingState,
  harnessRoot,
  harnessTarget,
  readHarnessVersion,
} from '../harness-target.ts';

/** MUI Autocomplete with multiple, rendered from @mui/material by packages/harness/mui. */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'To' });
// Chips are role="button" named by the person, like the Open and Clear buttons; MUI's
// data-item-index marks only the chips, so it is the handle that tells them apart.
const chips = (page: Page) => harnessRoot(page).locator('[role="button"][data-item-index]');

/** The delete icon is an aria-hidden SVG, so the recorded target honestly has no role or name. */
async function resolveClickTarget(page: Page, id: ChipsInteraction): Promise<ResolveClickResult> {
  if (id !== 'second-remove-control') return { ok: false, reason: 'Unknown interaction.' };
  // CSS: the icon has no role or name to locate it by; MuiChip-deleteIcon is MUI's own class.
  const locator = chips(page).nth(1).locator('.MuiChip-deleteIcon');
  if ((await locator.count()) !== 1)
    return { ok: false, reason: 'Second chip has no delete icon.' };
  return { ok: true, locator, target: { role: null, name: '' } };
}

export function createMuiAdapter(url: string): Adapter<ChipsState, ChipsInteraction> {
  return {
    id: 'mui',
    system: 'MUI',
    version: 2,
    url,
    page: 'packages/harness/mui/index.html',
    root: harnessRoot,
    items: {
      locate: chips,
      description: 'Elements with role="button" and MUI\'s data-item-index marker.',
    },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkStartingState({ input, chips, noun: 'chips' }),
    resolveClickTarget,
    readVersion: readHarnessVersion,
    notes:
      'Chips are role="button" tabindex=-1, named by the person; the delete icon is an aria-hidden SVG.',
  };
}

export const createMuiTarget = () => harnessTarget('mui', createMuiAdapter);
