import type { Page } from '@playwright/test';
import type { ChipsInteraction, ChipsState } from '../../scenarios/input-with-chips.ts';
import type { Adapter, ResolveClickResult } from '../adapter.ts';
import {
  checkStartingState,
  harnessRoot,
  harnessTarget,
  readHarnessVersion,
} from '../harness-target.ts';

/**
 * GitHub Primer Autocomplete with TextInputWithTokens, rendered from @primer/react by
 * packages/harness/primer. Deprecated by Primer; measured, shown, and not counted in agreement.
 */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'To' });
// Tokens have no role, so Primer's data-component marker is the only stable handle.
const tokens = (page: Page) =>
  harnessRoot(page).locator('[data-component="TextInputWithTokens.Token"]');

/** The remove icon is aria-hidden, so the recorded target honestly has no role and no name. */
async function resolveClickTarget(page: Page, id: ChipsInteraction): Promise<ResolveClickResult> {
  if (id !== 'second-remove-control') return { ok: false, reason: 'Unknown interaction.' };
  const locator = tokens(page).nth(1).locator('span[aria-hidden="true"]');
  if ((await locator.count()) !== 1)
    return { ok: false, reason: 'Second token has no remove icon.' };
  return { ok: true, locator, target: { role: null, name: '' } };
}

export function createPrimerAdapter(url: string): Adapter<ChipsState, ChipsInteraction> {
  return {
    id: 'primer',
    system: 'GitHub Primer',
    version: 3,
    url,
    page: 'packages/harness/primer/index.html',
    root: harnessRoot,
    items: {
      locate: tokens,
      description:
        'Elements with Primer\'s data-component="TextInputWithTokens.Token" marker (tokens have no role).',
    },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkStartingState({ input, chips: tokens, noun: 'tokens' }),
    resolveClickTarget,
    readVersion: readHarnessVersion,
    notes:
      'Deprecated by Primer. Tokens are span tabindex=-1 with no role; the remove icon is aria-hidden.',
  };
}

export const createPrimerTarget = () => harnessTarget('primer', createPrimerAdapter);
