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
 * React Aria ComboBox with multiple selection and a TagGroup, rendered from
 * react-aria-components by packages/harness/react-aria.
 */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'To' });
const tags = (page: Page) =>
  harnessRoot(page).getByRole('grid', { name: 'Selected people' }).getByRole('row');
const removeButtons = (page: Page) => harnessRoot(page).getByRole('button', { name: /^Remove / });

async function resolveClickTarget(page: Page, id: ChipsInteraction): Promise<ResolveClickResult> {
  if (id !== 'second-remove-control') return { ok: false, reason: 'Unknown interaction.' };
  const locator = removeButtons(page).nth(1);
  // The name comes from aria-labelledby ("Remove" plus the tag), so read the computed one.
  const name = /^- button "(.+)"/.exec(await locator.ariaSnapshot())?.[1];
  if (!name) return { ok: false, reason: 'Second remove button has no accessible name.' };
  return { ok: true, locator, target: { role: 'button', name } };
}

export function createReactAriaAdapter(url: string): Adapter<ChipsState, ChipsInteraction> {
  return {
    id: 'react-aria',
    system: 'React Aria',
    version: 2,
    url,
    page: 'packages/harness/react-aria/index.html',
    root: harnessRoot,
    items: { locate: tags, description: 'Rows in the grid "Selected people".' },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkStartingState({ input, chips: tags, noun: 'tags' }),
    resolveClickTarget,
    readVersion: readHarnessVersion,
    notes:
      'Tags are rows in a grid named "Selected people", after the input; each has a "Remove …" button.',
  };
}

export const createReactAriaTarget = () => harnessTarget('react-aria', createReactAriaAdapter);
