import { readFile } from 'node:fs/promises';
import type { Browser } from '@playwright/test';
import type { Adapter } from './adapters/adapter.ts';
import { openSession } from './runner/browser.ts';

export interface Environment {
  browser: string;
  engineVersion: string;
  os: string;
  systemVersion: Awaited<ReturnType<Adapter<never, never>['readVersion']>>;
}

async function engineVersion(): Promise<string> {
  const path = new URL('../package.json', import.meta.url);
  const parsed = JSON.parse(await readFile(path, 'utf8')) as { version: string };
  return parsed.version;
}

const browserName = (browser: Browser): string => `chromium ${browser.version()}`;
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export async function readEnvironment<State, InteractionId extends string>(
  adapter: Adapter<State, InteractionId>,
  headed: boolean,
): Promise<Environment> {
  const session = await openSession({ headed });
  try {
    try {
      await session.page.goto(adapter.url);
      await adapter.ready(session.page);
    } catch (error) {
      return {
        browser: browserName(session.browser),
        engineVersion: await engineVersion(),
        os: process.platform,
        systemVersion: {
          version: 'unknown',
          reason: `Target was not ready: ${errorMessage(error)}`,
        },
      };
    }
    let systemVersion: Environment['systemVersion'];
    try {
      systemVersion = await adapter.readVersion(session.page);
    } catch (error) {
      systemVersion = {
        version: 'unknown',
        reason: `System version could not be read: ${errorMessage(error)}`,
      };
    }
    return {
      browser: browserName(session.browser),
      engineVersion: await engineVersion(),
      os: process.platform,
      systemVersion,
    };
  } finally {
    await session.close();
  }
}
