import type { Page } from '@playwright/test';
import type { ChipsInteraction, ChipsState } from '../../scenarios/input-with-chips.ts';
import type { Adapter, ResolveClickResult } from '../adapter.ts';
import {
  checkStartingState,
  harnessRoot,
  harnessTarget,
  readHarnessVersion,
} from '../harness-target.ts';

/** Atlassian Select with isMulti, rendered from @atlaskit/select by packages/harness/atlassian. */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'To' });
// The remove control's accessible name is the only per-chip handle the select exposes.
const removeControls = (page: Page) => harnessRoot(page).getByRole('button', { name: /^Remove / });

async function resolveClickTarget(page: Page, id: ChipsInteraction): Promise<ResolveClickResult> {
  if (id !== 'second-remove-control') return { ok: false, reason: 'Unknown interaction.' };
  const locator = removeControls(page).nth(1);
  const name = await locator.getAttribute('aria-label');
  if (!name) return { ok: false, reason: 'Second remove control has no accessible name.' };
  return { ok: true, locator, target: { role: 'button', name } };
}

export function createAtlassianAdapter(url: string): Adapter<ChipsState, ChipsInteraction> {
  return {
    id: 'atlassian',
    system: 'Atlassian',
    version: 3,
    url,
    page: 'packages/harness/atlassian/index.html',
    root: harnessRoot,
    items: {
      locate: removeControls,
      description: 'Buttons named "Remove …", one per selected value (the values have no role).',
    },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkStartingState({ input, chips: removeControls, noun: 'chips' }),
    resolveClickTarget,
    readVersion: readHarnessVersion,
    notes:
      'Selected values render as role="presentation" containers with a "Remove …" button; no list semantics.',
  };
}

export const createAtlassianTarget = () => harnessTarget('atlassian', createAtlassianAdapter);
