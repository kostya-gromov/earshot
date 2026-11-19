import type { Page } from '@playwright/test';
import type { MenuButtonInteraction, MenuButtonState } from '../../scenarios/menu-button.ts';
import type { Adapter } from '../adapter.ts';
import { readReferenceVersion } from '../reference.ts';
import { checkClosed, clicksNothing, lastAction, lastActionDescription } from './harness.ts';

const button = (page: Page) => page.getByRole('button', { name: 'Actions' });
/** Hidden while closed, so it is found only while it is in the accessibility tree. */
const menu = (page: Page) => page.getByRole('menu', { name: 'Actions' });
const items = (page: Page) => menu(page).getByRole('menuitem');

/** The local reference menu button, served by @earshot/reference's static server. */
export function createMenuButtonReferenceAdapter(
  baseUrl: string,
): Adapter<MenuButtonState, MenuButtonInteraction> {
  return {
    id: 'reference',
    system: 'Reference',
    version: 1,
    url: new URL('/menu-button/', baseUrl).href,
    page: 'packages/reference/menu-button/index.html',
    root: (page) => page.locator('[data-menu-button]'),
    items: { locate: items, description: 'Menu items in the menu "Actions".' },
    popup: { locate: menu, opener: button, description: 'The menu "Actions".' },
    effect: { locate: lastAction, description: lastActionDescription },
    ready: async (page) => {
      // index.html marks the component once createMenuButton has run.
      await page.locator('[data-menu-button][data-ready="true"]').waitFor();
    },
    setup: checkClosed({ button, items, effect: lastAction }),
    resolveClickTarget: clicksNothing,
    readVersion: readReferenceVersion,
  };
}
