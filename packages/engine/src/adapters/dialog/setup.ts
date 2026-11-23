import type { Locator, Page } from '@playwright/test';
import type { DialogInteraction } from '../../scenarios/dialog.ts';
import type { ClickTarget, ResolveClickResult, SetupResult } from '../adapter.ts';

export interface DialogParts {
  /** The element with role dialog, open or not. */
  dialog: (page: Page) => Locator;
  opener: (page: Page) => Locator;
  /** The field of the page after the button, behind the dialog once it is open. */
  fieldAfter: (page: Page) => Locator;
  /**
   * The dialog's own controls as the accessibility tree names them, which is not always the text
   * in the source: MUI's buttons are named in capitals.
   */
  nameField: ClickTarget;
  cancel: ClickTarget;
  fieldAfterTarget: ClickTarget;
}

type Role = Parameters<Page['getByRole']>[0];

/** Every scenario starts with the dialog closed and focus on the button that opens it. */
export function setUpDialog(parts: DialogParts) {
  return async (page: Page): Promise<SetupResult> => {
    if (await parts.dialog(page).isVisible()) {
      return { ok: false, reason: 'The dialog was already open when the page loaded.' };
    }
    await parts.opener(page).focus();
    return { ok: true, actualStateDescription: 'Dialog closed, focus on the button that opens it' };
  };
}

const wholeName = (name: string) =>
  new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

export function resolveDialogClick(parts: DialogParts) {
  // The whole name, in any case: the target carries the name the accessibility tree gives
  // ("CANCEL" for MUI, whose CSS capitalises it), while Playwright computes names from the text.
  const inside = (page: Page, { role, name }: ClickTarget) =>
    parts.dialog(page).getByRole(role as Role, { name: wholeName(name) });
  return (page: Page, id: DialogInteraction): Promise<ResolveClickResult> => {
    const resolved: Record<DialogInteraction, ResolveClickResult> = {
      'name-field': { ok: true, locator: inside(page, parts.nameField), target: parts.nameField },
      cancel: { ok: true, locator: inside(page, parts.cancel), target: parts.cancel },
      'field-after': {
        ok: true,
        locator: parts.fieldAfter(page),
        target: parts.fieldAfterTarget,
        atPoint: true,
      },
    };
    return Promise.resolve(resolved[id]);
  };
}
