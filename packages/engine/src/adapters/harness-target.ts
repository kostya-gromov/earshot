import { existsSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { startServer } from '@earshot/reference/serve';
import type { SystemVersion } from '@earshot/contracts';
import type { ChipsState } from '../scenarios/input-with-chips.ts';
import type { TargetFactory } from '../suites/types.ts';
import type { Adapter, SetupResult } from './adapter.ts';

// Harness pages (ADR 0005): each system's published package at a pinned version, rendered by
// packages/harness into dist/<system>/ with the reference's three people already selected.
const distRoot = fileURLToPath(new URL('../../../harness/dist/', import.meta.url));

/** The component and the From/Subject fields around it; everything the scenarios touch. */
export const harnessRoot = (page: Page) => page.locator('[data-earshot-root]');

/** The installed package and version, written into the page at build time from its manifest. */
export async function readHarnessVersion(page: Page): Promise<SystemVersion> {
  const meta = page.locator('meta[name="earshot-package"]');
  const [name, version] = await Promise.all([
    meta.getAttribute('content'),
    meta.getAttribute('data-version'),
  ]);
  if (!name || !version) {
    return { version: 'unknown', reason: 'The harness page has no earshot-package meta tag.' };
  }
  return { version, source: `${name} installed in packages/harness (pnpm-lock.yaml)` };
}

interface StartingState {
  input: (page: Page) => Locator;
  chips: (page: Page) => Locator;
  noun: string;
}

/**
 * The people are set through the component's own props, so setup only checks the starting state
 * and puts focus in the input, where every scenario begins.
 */
export function checkStartingState({ input, chips, noun }: StartingState) {
  return async (page: Page, { selectedItemCount }: ChipsState): Promise<SetupResult> => {
    const count = await chips(page).count();
    if (count !== selectedItemCount) {
      return { ok: false, reason: `Expected ${selectedItemCount} ${noun}, found ${count}.` };
    }
    if ((await input(page).inputValue()) !== '')
      return { ok: false, reason: 'Input is not empty.' };
    await input(page).focus();
    if ((await input(page).getAttribute('aria-expanded')) === 'true') {
      return { ok: false, reason: 'The options menu is open.' };
    }
    return {
      ok: true,
      actualStateDescription: `${count} ${noun}, empty input focused, menu closed`,
    };
  };
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

/**
 * Serves the built harness locally for one system; fails clearly when it was not built. A system
 * has one page per pattern: index.html for input with chips, `<pattern>.html` for the others.
 */
export function harnessTarget<State, InteractionId extends string>(
  id: string,
  createAdapter: (pageUrl: string) => Adapter<State, InteractionId>,
  page = 'index.html',
): TargetFactory<State, InteractionId> {
  return {
    id,
    async open() {
      if (!existsSync(`${distRoot}${id}/${page}`)) {
        throw new Error(
          `No harness page ${page} for ${id}. Build it first: pnpm -C packages/harness build`,
        );
      }
      const server = await startServer({ port: 0, root: distRoot, home: '/' });
      const port = (server.address() as AddressInfo).port;
      const path = page === 'index.html' ? '' : page;
      return {
        adapter: createAdapter(`http://localhost:${port}/${id}/${path}`),
        close: () => closeServer(server),
      };
    },
  };
}
