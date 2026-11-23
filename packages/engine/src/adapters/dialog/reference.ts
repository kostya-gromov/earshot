import type { Page } from '@playwright/test';
import type { DialogInteraction, DialogStart } from '../../scenarios/dialog.ts';
import type { Adapter } from '../adapter.ts';
import { readReferenceVersion } from '../reference.ts';
import { resolveDialogClick, setUpDialog, type DialogParts } from './setup.ts';

// By element, not by role: a role lookup would depend on what the tree exposes at that moment,
// and that is what the engine is there to record (the page behind an open modal dialog is inert).
const dialog = (page: Page) => page.locator('[data-dialog] dialog');
const opener = (page: Page) => page.locator('[data-dialog] [data-dialog-open]');

const parts: DialogParts = {
  dialog,
  opener,
  // By id for the same reason: once the dialog is open this field is not in the tree.
  fieldAfter: (page) => page.locator('#notes'),
  nameField: { role: 'textbox', name: 'Name' },
  cancel: { role: 'button', name: 'Cancel' },
  fieldAfterTarget: { role: 'textbox', name: 'Notes' },
};

/** The local reference dialog, served by @earshot/reference's static server. */
export function createDialogReferenceAdapter(
  baseUrl: string,
): Adapter<DialogStart, DialogInteraction> {
  return {
    id: 'reference',
    system: 'Reference',
    version: 1,
    url: new URL('/dialog/', baseUrl).href,
    page: 'packages/reference/dialog/index.html',
    root: (page) => page.locator('[data-dialog]'),
    items: {
      locate: (page) => dialog(page).getByRole('textbox').or(dialog(page).getByRole('button')),
      description: 'Text fields and buttons inside the dialog.',
    },
    dialog: {
      locate: dialog,
      opener,
      description: 'The dialog element, and the button "Edit profile" that opens it.',
    },
    ready: async (page) => {
      // index.html marks the component once createDialog has run.
      await page.locator('[data-dialog][data-ready="true"]').waitFor();
    },
    setup: setUpDialog(parts),
    resolveClickTarget: resolveDialogClick(parts),
    readVersion: readReferenceVersion,
  };
}
