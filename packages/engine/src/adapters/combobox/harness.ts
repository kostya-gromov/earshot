import type { Locator, Page } from '@playwright/test';
import type { ComboboxState } from '../../scenarios/combobox.ts';
import type { SetupResult } from '../adapter.ts';

/**
 * The six options are set through the component's own props, and most systems render them only
 * while the popup is open, so setup checks what can be seen without touching the component:
 * an empty, closed combobox. Then it puts focus in the input, where every scenario begins.
 */
export function checkEmptyClosed(input: (page: Page) => Locator, options: (page: Page) => Locator) {
  return async (page: Page, _state: ComboboxState): Promise<SetupResult> => {
    if ((await input(page).inputValue()) !== '')
      return { ok: false, reason: 'Input is not empty.' };
    await input(page).focus();
    const shown = await options(page).count();
    if (shown > 0) {
      // Opening on focus is allowed by APG, but the scenarios start from a closed popup.
      return {
        ok: false,
        reason: `The popup showed ${shown} options as soon as the input had focus.`,
      };
    }
    return { ok: true, actualStateDescription: 'empty combobox focused, popup closed' };
  };
}

export const clicksNothing = () =>
  Promise.resolve({ ok: false as const, reason: 'The combobox scenarios click nothing.' });
