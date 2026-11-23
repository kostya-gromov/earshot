import type { Page } from '@playwright/test';
import type { DialogInteraction, DialogStart } from '../../scenarios/dialog.ts';
import type { Adapter } from '../adapter.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';
import { resolveDialogClick, setUpDialog, type DialogParts } from './setup.ts';

interface HarnessDialog {
  /** The measurement's file name; also the system's folder in packages/harness unless `page` says otherwise. */
  id: string;
  system: string;
  notes: string;
  /** For a variant (data/targets.yaml, `variant-of`): the system's folder and the page in it. */
  page?: { folder: string; file: string };
  /** Where the tree names a control otherwise than its text: MUI's buttons are in capitals. */
  cancelName?: string;
}

// By attribute and element, not by role lookup: what the tree exposes is what the engine records.
// Page-wide: systems render the dialog at the end of the document.
const dialog = (page: Page) => page.locator('[role="dialog"], dialog');
// By text for the same reason: a system may hide the page behind from the tree while it is open.
const opener = (page: Page) => harnessRoot(page).locator('button', { hasText: 'Edit profile' });

/**
 * A system's modal dialog on its harness page. The pages are built alike on purpose (the same
 * button, title, field and buttons, the same fields around), so what differs between systems is
 * what the engine records, not how it finds the parts.
 */
function createHarnessDialogAdapter(
  { id, system, notes, page, cancelName = 'Cancel' }: HarnessDialog,
  url: string,
): Adapter<DialogStart, DialogInteraction> {
  const parts: DialogParts = {
    dialog,
    opener,
    // By id: the field is a sibling of the root, and behind an open dialog it may not be in the tree.
    fieldAfter: (p) => p.locator('#notes'),
    nameField: { role: 'textbox', name: 'Name' },
    cancel: { role: 'button', name: cancelName },
    fieldAfterTarget: { role: 'textbox', name: 'Notes' },
  };
  return {
    id,
    system,
    version: 1,
    url,
    page: `packages/harness/${page?.folder ?? id}/${page?.file ?? 'dialog.html'}`,
    root: harnessRoot,
    items: {
      locate: (p) => dialog(p).getByRole('textbox').or(dialog(p).getByRole('button')),
      description: 'Text fields and buttons inside the dialog.',
    },
    dialog: {
      locate: dialog,
      opener,
      description:
        'The element with role="dialog" on the page, and the button "Edit profile" that opens it.',
    },
    ready: (p) => opener(p).waitFor({ timeout: 20_000 }),
    setup: setUpDialog(parts),
    resolveClickTarget: resolveDialogClick(parts),
    readVersion: readHarnessVersion,
    notes,
  };
}

export function createHarnessDialogTarget(parts: HarnessDialog) {
  const { folder, file } = parts.page ?? { folder: parts.id, file: 'dialog.html' };
  // The harness is served by folder; the target and its measurement go by the adapter's id.
  return {
    ...harnessTarget(folder, (url) => createHarnessDialogAdapter(parts, url), file),
    id: parts.id,
  };
}
