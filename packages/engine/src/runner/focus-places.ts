import type { Locator, Page } from '@playwright/test';
import type { FocusInfo } from '@earshot/contracts';
import { readFocus } from '../capture/focus.ts';
import type { Adapter } from '../adapters/adapter.ts';
import type { Session } from './browser.ts';

/*
 * Focus with the places the adapter knows: which item holds it, and whether it is in the popup,
 * in a shown panel or in the dialog. Split from observe-step.ts when the dialog became the
 * fourth place (engine 0.18.0).
 */

/** Which of the adapter's items holds focus (on it or inside it), if any. */
async function withItem<State, InteractionId extends string>(
  page: Page,
  adapter: Adapter<State, InteractionId>,
  focus: FocusInfo,
): Promise<FocusInfo> {
  // Not limited to the component root: an option may hold focus in a popup rendered outside it.
  if (focus.isBody) return focus;
  const item = await adapter.items.locate(page).evaluateAll((elements) => {
    const active = window.__earshot.deepActiveElement();
    const index = active ? elements.findIndex((element) => element.contains(active)) : -1;
    return index === -1 ? undefined : { index: index + 1, count: elements.length };
  });
  return item ? { ...focus, item } : focus;
}

/** Focus is on one of the located elements or inside it, wherever on the page it is rendered. */
const isFocusInside = (locator: Locator): Promise<boolean> =>
  locator.evaluateAll((elements) => {
    const active = window.__earshot.deepActiveElement();
    return active !== null && elements.some((element) => element.contains(active));
  });

export async function focusNow<State, InteractionId extends string>(
  { page, cdp }: Session,
  adapter: Adapter<State, InteractionId>,
): Promise<FocusInfo> {
  const focus = await withItem(page, adapter, await readFocus(cdp));
  const { popup, panels, dialog } = adapter;
  return {
    ...focus,
    ...(popup ? { isInsidePopup: await isFocusInside(popup.locate(page)) } : {}),
    ...(panels ? { isInsidePanel: await isFocusInside(panels.locate(page)) } : {}),
    ...(dialog ? { isInsideDialog: await isFocusInside(dialog.locate(page)) } : {}),
  };
}
