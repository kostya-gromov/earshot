import type { Locator, Page } from '@playwright/test';
import type { MenuButtonState } from '../../scenarios/menu-button.ts';
import type { SetupResult } from '../adapter.ts';

/**
 * The four items are set through the component's own props, and most systems render them only
 * while the menu is open, so setup checks what can be seen without touching the component: a
 * closed menu and a page that says no action has run. Then it puts focus on the button, where
 * every scenario begins.
 */
export function checkClosed(parts: {
  button: (page: Page) => Locator;
  items: (page: Page) => Locator;
  effect: (page: Page) => Locator;
}) {
  return async (page: Page, _state: MenuButtonState): Promise<SetupResult> => {
    const shown = await parts.items(page).count();
    if (shown > 0) return { ok: false, reason: `The menu showed ${shown} items before any key.` };
    const said = (await parts.effect(page).textContent())?.trim();
    if (said !== 'Last action: none') {
      return { ok: false, reason: `The page said "${said ?? ''}" before any key.` };
    }
    await parts.button(page).focus();
    return { ok: true, actualStateDescription: 'button focused, menu closed, no action run' };
  };
}

export const clicksNothing = () =>
  Promise.resolve({ ok: false as const, reason: 'The menu button scenarios click nothing.' });

/** Where every measured page says what the last action was. */
export const lastAction = (page: Page) => page.locator('#last-action');
export const lastActionDescription =
  'The line "Last action" on the page, written by each item’s own handler.';
