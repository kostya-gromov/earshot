import type { Page } from '@playwright/test';
import type { MenuButtonInteraction, MenuButtonState } from '../../scenarios/menu-button.ts';
import type { Adapter } from '../adapter.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';
import { checkClosed, clicksNothing, lastAction, lastActionDescription } from './harness.ts';

interface HarnessMenu {
  /** The measurement's file name; also the system's folder in packages/harness unless `page` says otherwise. */
  id: string;
  system: string;
  notes: string;
  /**
   * For a variant of a system (data/targets.yaml, `variant-of`): the system's folder and the
   * page in it, when they are not `<id>/menu-button.html`.
   */
  page?: { folder: string; file: string };
}

// Every harness page has one button named "Actions" in the root and one menu on the page.
const button = (page: Page) => harnessRoot(page).getByRole('button', { name: 'Actions' });
// Page-wide, not under the root: systems render the menu at the end of the document.
const menu = (page: Page) => page.getByRole('menu');
const items = (page: Page) => menu(page).getByRole('menuitem');

/**
 * A system's menu button on its harness page. The pages are built alike on purpose (the same
 * button name, the same four items, the same "Last action" line), so what differs between
 * systems is what the engine records, not how it finds the parts.
 */
function createHarnessMenuAdapter(
  { id, system, notes, page }: HarnessMenu,
  url: string,
): Adapter<MenuButtonState, MenuButtonInteraction> {
  return {
    id,
    system,
    version: 1,
    url,
    page: `packages/harness/${page?.folder ?? id}/${page?.file ?? 'menu-button.html'}`,
    root: harnessRoot,
    items: { locate: items, description: 'Elements with role="menuitem" in the menu.' },
    popup: { locate: menu, opener: button, description: 'The element with role="menu".' },
    effect: { locate: lastAction, description: lastActionDescription },
    ready: (page) => button(page).waitFor({ timeout: 20_000 }),
    setup: checkClosed({ button, items, effect: lastAction }),
    resolveClickTarget: clicksNothing,
    readVersion: readHarnessVersion,
    notes,
  };
}

export function createHarnessMenuTarget(parts: HarnessMenu) {
  const { folder, file } = parts.page ?? { folder: parts.id, file: 'menu-button.html' };
  // The harness is served by folder; the target and its measurement go by the adapter's id.
  return {
    ...harnessTarget(folder, (url) => createHarnessMenuAdapter(parts, url), file),
    id: parts.id,
  };
}
