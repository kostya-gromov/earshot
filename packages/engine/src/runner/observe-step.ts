import type { Page } from '@playwright/test';
import type {
  Action,
  Announcement,
  FocusInfo,
  InsertedRegion,
  PopupState,
  Settle,
  TabSetState,
} from '@earshot/contracts';
import { readAxSubtree } from '../capture/ax-tree.ts';
import { readFocus } from '../capture/focus.ts';
import { drainAnnouncements, drainInsertedRegions, pageNow } from '../capture/live-regions.ts';
import { readPopup } from '../capture/popup.ts';
import { readTabSet } from '../capture/tab-set.ts';
import type { Adapter } from '../adapters/adapter.ts';
import { announcementsInWindow, insertedRegionsInWindow } from '../model/announcements.ts';
import type { AxEntry } from '../model/ax-tree.ts';
import type { Session } from './browser.ts';
import { settle } from './settle.ts';

/** Everything recorded for one action, before the core turns it into a Step (diff, speech). */
export interface StepObservation {
  action: Action;
  focusBefore: FocusInfo;
  focusAfter: FocusInfo;
  announcements: Announcement[];
  insertedRegions: InsertedRegion[];
  axBefore: AxEntry[];
  axAfter: AxEntry[];
  settle: Settle;
  /** Only for adapters that declare a popup. */
  popup?: { before: PopupState; after: PopupState };
  /** Only for adapters that declare an effect element. */
  effect?: { before: string; after: string };
  /** Only for adapters that declare panels (tabs). */
  tabSet?: { before: TabSetState; after: TabSetState };
}

type Role = Parameters<Page['getByRole']>[0];

/** Real input only: keyboard.press keeps Tab order and caret movement native (packages/engine/CLAUDE.md, One run). */
async function perform<State, InteractionId extends string>(
  page: Page,
  adapter: Adapter<State, InteractionId>,
  action: Action,
): Promise<void> {
  switch (action.type) {
    case 'press':
      return page.keyboard.press(action.key);
    case 'type':
      return page.keyboard.type(action.text);
    case 'click': {
      const { role, name } = action.target;
      if (!role) throw new Error(`Click target "${name}" has no role to locate it by.`);
      return adapter
        .root(page)
        .getByRole(role as Role, { name, exact: true })
        .click();
    }
  }
}

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

/** For adapters with a popup: whether focus is on it or inside it, wherever it is rendered. */
async function withPopup<State, InteractionId extends string>(
  page: Page,
  adapter: Adapter<State, InteractionId>,
  focus: FocusInfo,
): Promise<FocusInfo> {
  if (!adapter.popup) return focus;
  const isInsidePopup = await adapter.popup.locate(page).evaluateAll((popups) => {
    const active = window.__earshot.deepActiveElement();
    return active !== null && popups.some((popup) => popup.contains(active));
  });
  return { ...focus, isInsidePopup };
}

/** For adapters with panels (tabs): whether focus is on or inside a panel. */
async function withPanel<State, InteractionId extends string>(
  page: Page,
  adapter: Adapter<State, InteractionId>,
  focus: FocusInfo,
): Promise<FocusInfo> {
  if (!adapter.panels) return focus;
  const isInsidePanel = await adapter.panels.locate(page).evaluateAll((panels) => {
    const active = window.__earshot.deepActiveElement();
    return active !== null && panels.some((panel) => panel.contains(active));
  });
  return { ...focus, isInsidePanel };
}

/** Focus with the places the adapter knows: which item, in the popup, in a panel. */
async function focusNow<State, InteractionId extends string>(
  session: Session,
  adapter: Adapter<State, InteractionId>,
): Promise<FocusInfo> {
  const focus = await withItem(session.page, adapter, await readFocus(session.cdp));
  return withPanel(session.page, adapter, await withPopup(session.page, adapter, focus));
}

/** Every tab and every shown panel now, for adapters that declare panels. */
async function tabSetNow<State, InteractionId extends string>(
  session: Session,
  adapter: Adapter<State, InteractionId>,
): Promise<TabSetState | undefined> {
  if (!adapter.panels) return undefined;
  return readTabSet(session, { tabs: adapter.items.locate, panels: adapter.panels.locate });
}

/** What the page says the last action was, for adapters that declare where it says so. */
async function effectNow<State, InteractionId extends string>(
  page: Page,
  adapter: Adapter<State, InteractionId>,
): Promise<string | undefined> {
  if (!adapter.effect) return undefined;
  const texts = await adapter.effect.locate(page).allTextContents();
  return texts.join(' ').trim();
}

/** The popup's state now, for adapters that declare one; undefined for patterns without it. */
async function popupNow<State, InteractionId extends string>(
  session: Session,
  adapter: Adapter<State, InteractionId>,
): Promise<PopupState | undefined> {
  if (!adapter.popup) return undefined;
  return readPopup(session, {
    popup: adapter.popup.locate,
    options: adapter.items.locate,
    opener: adapter.popup.opener,
  });
}

/**
 * Performs one action and records what changed. `axBefore` is the previous step's tree, so
 * each state is captured once (ADR 0003, section 3).
 */
export async function observeStep<State, InteractionId extends string>(
  session: Session,
  adapter: Adapter<State, InteractionId>,
  {
    action,
    axBefore,
    performAction,
  }: { action: Action; axBefore: AxEntry[]; performAction?: () => Promise<void> },
): Promise<StepObservation> {
  const { page, cdp } = session;
  const focusBefore = await focusNow(session, adapter);
  const popupBefore = await popupNow(session, adapter);
  const effectBefore = await effectNow(page, adapter);
  const tabSetBefore = await tabSetNow(session, adapter);
  await drainAnnouncements(page); // anything before this step is not this step's
  await drainInsertedRegions(page);
  const start = await pageNow(page);

  await (performAction ? performAction() : perform(page, adapter, action));
  const settled = await settle(page);

  const end = await pageNow(page);
  const announcements = announcementsInWindow(await drainAnnouncements(page), { start, end });
  const insertedRegions = insertedRegionsInWindow(await drainInsertedRegions(page), { start, end });
  const popupAfter = await popupNow(session, adapter);
  const effectAfter = await effectNow(page, adapter);
  const tabSetAfter = await tabSetNow(session, adapter);
  return {
    ...(tabSetBefore && tabSetAfter
      ? { tabSet: { before: tabSetBefore, after: tabSetAfter } }
      : {}),
    ...(effectBefore !== undefined && effectAfter !== undefined
      ? { effect: { before: effectBefore, after: effectAfter } }
      : {}),
    ...(popupBefore && popupAfter ? { popup: { before: popupBefore, after: popupAfter } } : {}),
    action,
    focusBefore,
    focusAfter: await focusNow(session, adapter),
    announcements,
    insertedRegions,
    axBefore,
    axAfter: await readAxSubtree(cdp),
    settle: settled,
  };
}
