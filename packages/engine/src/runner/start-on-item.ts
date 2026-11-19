import type { Page } from '@playwright/test';
import type { Adapter, SetupResult } from '../adapters/adapter.ts';

/**
 * Moves focus to the last of the adapter's items. Calling focus() changes no markup; an item a
 * user cannot focus (no tabindex) stays unfocused, and the scenario is then inconclusive.
 */
export async function focusLastItem<State, InteractionId extends string>(
  page: Page,
  adapter: Adapter<State, InteractionId>,
  setup: Extract<SetupResult, { ok: true }>,
): Promise<SetupResult> {
  const items = adapter.items.locate(page);
  if ((await items.count()) === 0) return { ok: false, reason: 'No chips found to start on.' };
  const last = items.last();
  await last.focus();
  const isFocused = await last.evaluate((element) => {
    const active = window.__earshot.deepActiveElement();
    return active !== null && element.contains(active);
  });
  if (!isFocused) {
    return {
      ok: false,
      reason: 'The last chip cannot take focus, so the chips cannot be tested on their own.',
    };
  }
  return {
    ok: true,
    actualStateDescription: `${setup.actualStateDescription}, then focus moved to the last chip`,
  };
}
