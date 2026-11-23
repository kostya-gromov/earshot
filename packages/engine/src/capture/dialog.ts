import type { CDPSession, Locator, Page } from '@playwright/test';
import type { DialogState } from '@earshot/contracts';
import { releaseGroup } from './cdp.ts';
import { exposedNodes } from './exposed-nodes.ts';

/*
 * The dialog, its visible title and the button that opens it, as assistive technology sees them
 * (dialog, engine 0.18.0). The adapter says where they are: systems render a dialog at the end
 * of the page, outside the component root that the tree diff covers.
 */

const GROUP = 'earshot-dialog';

export interface DialogLocators {
  dialog: (page: Page) => Locator;
  opener: (page: Page) => Locator;
}

export async function readDialog(
  session: { page: Page; cdp: CDPSession },
  locators: DialogLocators,
): Promise<DialogState> {
  const read = (key: string, locator: Locator) =>
    exposedNodes(session, { key, locator, objectGroup: GROUP });
  try {
    const [dialog] = await read('dialog', locators.dialog(session.page));
    // Hidden headings are included so the tree, not Playwright, decides what is exposed.
    const headings = locators.dialog(session.page).getByRole('heading', { includeHidden: true });
    const [heading] = dialog ? await read('dialog-heading', headings) : [];
    const [opener] = await read('dialog-opener', locators.opener(session.page));
    return {
      ...(dialog ? { dialog } : {}),
      ...(heading ? { heading: heading.name } : {}),
      ...(opener ? { opener } : {}),
    };
  } finally {
    await releaseGroup(session.cdp, GROUP);
  }
}
