import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import type { ChipsInteraction, ChipsState } from '../scenarios/input-with-chips.ts';
import type { Adapter, ResolveClickResult, SetupResult } from './adapter.ts';

async function setupReference(page: Page, { selectedItemCount }: ChipsState): Promise<SetupResult> {
  const labels = await page
    .getByRole('list', { name: 'Selected people' })
    .getByRole('button', { name: /^Remove / })
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label') ?? ''));
  const names = labels.map((label) => label.replace(/^Remove /, ''));
  if (names.length !== selectedItemCount) {
    return {
      ok: false,
      reason: `Expected ${selectedItemCount} chips, found ${names.length}: ${names.join(', ')}`,
    };
  }
  const input = page.getByRole('combobox', { name: 'To' });
  if ((await input.inputValue()) !== '') return { ok: false, reason: 'Expected an empty input.' };
  await input.focus();
  return { ok: true, actualStateDescription: `${names.length} chips, empty input focused` };
}

async function resolveReferenceClick(page: Page): Promise<ResolveClickResult> {
  const locator = page
    .getByRole('list', { name: 'Selected people' })
    .getByRole('button', { name: /^Remove / })
    .nth(1);
  const name = await locator.getAttribute('aria-label');
  if (!name) return { ok: false, reason: 'Second remove control has no accessible name.' };
  return { ok: true, locator, target: { role: 'button', name } };
}

export async function readReferenceVersion() {
  const path = fileURLToPath(import.meta.resolve('@earshot/reference/package.json'));
  const { version } = JSON.parse(await readFile(path, 'utf8')) as { version: string };
  return { version, source: 'packages/reference/package.json' };
}

/** The local reference implementation, served by @earshot/reference's static server. */
export function createReferenceAdapter(baseUrl: string): Adapter<ChipsState, ChipsInteraction> {
  return {
    id: 'reference',
    system: 'Reference',
    version: 2,
    url: new URL('/input-with-chips/', baseUrl).href,
    page: 'packages/reference/input-with-chips/index.html',
    root: (page) => page.locator('[data-chip-field]'),
    items: {
      locate: (page) =>
        page
          .getByRole('list', { name: 'Selected people' })
          .getByRole('button', { name: /^Remove / }),
      description: 'Buttons named "Remove …" in the list "Selected people".',
    },
    ready: async (page) => {
      // index.html marks the field once createChipField has run.
      await page.locator('[data-chip-field][data-ready="true"]').waitFor();
    },

    setup: setupReference,

    async resolveClickTarget(page, id) {
      if (id !== 'second-remove-control') {
        return { ok: false, reason: 'Unknown reference interaction.' };
      }
      return resolveReferenceClick(page);
    },

    readVersion: readReferenceVersion,
  };
}
