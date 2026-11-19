import type { Page } from '@playwright/test';
import type { ChipsInteraction, ChipsState } from '../../scenarios/input-with-chips.ts';
import type { Adapter, ResolveClickResult } from '../adapter.ts';
import {
  checkStartingState,
  harnessRoot,
  harnessTarget,
  readHarnessVersion,
} from '../harness-target.ts';

/** Fluent 2 TagPicker, rendered from @fluentui/react-components by packages/harness/fluent. */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'To' });
const selectedTags = (page: Page) =>
  harnessRoot(page).getByRole('listbox', { name: 'Selected people' }).getByRole('option');

/** A Fluent tag is itself the dismiss control: clicking the tag removes it. */
async function resolveClickTarget(page: Page, id: ChipsInteraction): Promise<ResolveClickResult> {
  if (id !== 'second-remove-control') return { ok: false, reason: 'Unknown interaction.' };
  const locator = selectedTags(page).nth(1);
  // The recorded target must be the accessible name, which the AX diff compares against;
  // textContent would include the avatar's initials.
  const name = /^- option "(.+)"/.exec(await locator.ariaSnapshot())?.[1];
  if (!name) return { ok: false, reason: 'Second tag has no accessible name.' };
  return { ok: true, locator, target: { role: 'option', name } };
}

export function createFluentAdapter(url: string): Adapter<ChipsState, ChipsInteraction> {
  return {
    id: 'fluent',
    system: 'Fluent 2',
    version: 3,
    url,
    page: 'packages/harness/fluent/index.html',
    root: harnessRoot,
    items: { locate: selectedTags, description: 'Options in the listbox "Selected people".' },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkStartingState({ input, chips: selectedTags, noun: 'tags' }),
    resolveClickTarget,
    readVersion: readHarnessVersion,
    notes:
      'Selected tags are role="option" in a listbox named "Selected people"; each tag is its own dismiss button.',
  };
}

export const createFluentTarget = () => harnessTarget('fluent', createFluentAdapter);
