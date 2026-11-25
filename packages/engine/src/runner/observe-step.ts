import type { Page } from '@playwright/test';
import type {
  Action,
  Announcement,
  DialogState,
  FocusInfo,
  InsertedRegion,
  PopupState,
  Settle,
  TabSetState,
} from '@earshot/contracts';
import { readAxSubtree } from '../capture/ax-tree.ts';
import { drainAnnouncements, drainInsertedRegions, pageNow } from '../capture/live-regions.ts';
import type { Adapter } from '../adapters/adapter.ts';
import { announcementsInWindow, insertedRegionsInWindow } from '../model/announcements.ts';
import type { AxEntry } from '../model/ax-tree.ts';
import { pairStates, statesNow } from './adapter-states.ts';
import type { Session } from './browser.ts';
import { focusNow } from './focus-places.ts';
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
  /** Only for adapters that declare a visible label (select). */
  label?: { before: string; after: string };
  /** Only for adapters that declare panels (tabs). */
  tabSet?: { before: TabSetState; after: TabSetState };
  /** Only for adapters that declare a dialog. */
  dialog?: { before: DialogState; after: DialogState };
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
  const statesBefore = await statesNow(session, adapter);
  await drainAnnouncements(page); // anything before this step is not this step's
  await drainInsertedRegions(page);
  const start = await pageNow(page);

  await (performAction ? performAction() : perform(page, adapter, action));
  const settled = await settle(page);

  const end = await pageNow(page);
  const announcements = announcementsInWindow(await drainAnnouncements(page), { start, end });
  const insertedRegions = insertedRegionsInWindow(await drainInsertedRegions(page), { start, end });
  return {
    ...pairStates(statesBefore, await statesNow(session, adapter)),
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
