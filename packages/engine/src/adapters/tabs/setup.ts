import type { Locator, Page } from '@playwright/test';
import type { TabsState } from '../../scenarios/tabs.ts';
import type { SetupResult } from '../adapter.ts';

export interface TabsParts {
  tab: (page: Page, name: string) => Locator;
  fieldBefore: (page: Page) => Locator;
  fieldAfter: (page: Page) => Locator;
}

const where: Record<TabsState['start'], string> = {
  'active-tab': 'focus on it',
  'field-before': 'focus in the field before',
  'field-after': 'focus in the field after',
};

/**
 * Overview is active when every measured page loads. Members is reached with a mouse click, as a
 * person would, never by changing the page; then setup checks that it is the selected tab and
 * puts focus where the scenario begins.
 */
export function setUpTabs(parts: TabsParts) {
  return async (page: Page, { active, start }: TabsState): Promise<SetupResult> => {
    if (active !== 'Overview') await parts.tab(page, active).click();
    const selected = await parts.tab(page, active).getAttribute('aria-selected');
    if (selected !== 'true') {
      return { ok: false, reason: `"${active}" was not selected (aria-selected="${selected}").` };
    }
    const target = {
      'active-tab': () => parts.tab(page, active),
      'field-before': () => parts.fieldBefore(page),
      'field-after': () => parts.fieldAfter(page),
    }[start]();
    await target.focus();
    return { ok: true, actualStateDescription: `${active} active, ${where[start]}` };
  };
}

export const clicksNothing = () =>
  Promise.resolve({ ok: false as const, reason: 'The tabs scenarios click nothing.' });
