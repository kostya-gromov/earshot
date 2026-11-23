import type { DialogState, PopupState, TabSetState } from '@earshot/contracts';
import { readDialog } from '../capture/dialog.ts';
import { readPopup } from '../capture/popup.ts';
import { readTabSet } from '../capture/tab-set.ts';
import type { Adapter } from '../adapters/adapter.ts';
import type { Session } from './browser.ts';

/** What the adapter's declared parts look like at one moment; a part it does not declare is absent. */
export interface AdapterStates {
  popup?: PopupState;
  /** What the page says the last action was. */
  effect?: string;
  tabSet?: TabSetState;
  dialog?: DialogState;
}

/** Split from observe-step.ts when the dialog became the fourth declared part (engine 0.18.0). */
export async function statesNow<State, InteractionId extends string>(
  session: Session,
  adapter: Adapter<State, InteractionId>,
): Promise<AdapterStates> {
  const { popup, effect, panels, dialog, items } = adapter;
  const { page } = session;
  return {
    ...(popup
      ? {
          popup: await readPopup(session, {
            popup: popup.locate,
            options: items.locate,
            opener: popup.opener,
          }),
        }
      : {}),
    ...(effect ? { effect: (await effect.locate(page).allTextContents()).join(' ').trim() } : {}),
    ...(panels
      ? { tabSet: await readTabSet(session, { tabs: items.locate, panels: panels.locate }) }
      : {}),
    ...(dialog
      ? { dialog: await readDialog(session, { dialog: dialog.locate, opener: dialog.opener }) }
      : {}),
  };
}

type Pair<T> = { before: T; after: T };
type Pairs = { [K in keyof AdapterStates]?: Pair<NonNullable<AdapterStates[K]>> };

/** The parts both moments recorded, each as a before and an after. */
export function pairStates(before: AdapterStates, after: AdapterStates): Pairs {
  const pair = <K extends keyof AdapterStates>(key: K): Pairs => {
    const [was, is] = [before[key], after[key]];
    return was === undefined || is === undefined ? {} : { [key]: { before: was, after: is } };
  };
  return { ...pair('popup'), ...pair('effect'), ...pair('tabSet'), ...pair('dialog') };
}
