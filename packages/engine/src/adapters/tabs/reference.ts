import type { Page } from '@playwright/test';
import type { TabsInteraction, TabsState } from '../../scenarios/tabs.ts';
import type { Adapter } from '../adapter.ts';
import { readReferenceVersion } from '../reference.ts';
import { clicksNothing, setUpTabs } from './setup.ts';

const tabList = (page: Page) => page.getByRole('tablist', { name: 'Project' });
const tab = (page: Page, name: string) => tabList(page).getByRole('tab', { name, exact: true });
// Hidden panels are included: whether each is shown is what the engine reads from the tree.
const panels = (page: Page) => page.getByRole('tabpanel', { includeHidden: true });

/** The local reference tabs, served by @earshot/reference's static server. */
export function createTabsReferenceAdapter(baseUrl: string): Adapter<TabsState, TabsInteraction> {
  return {
    id: 'reference',
    system: 'Reference',
    version: 1,
    url: new URL('/tabs/', baseUrl).href,
    page: 'packages/reference/tabs/index.html',
    root: (page) => page.locator('[data-tabs]'),
    items: {
      locate: (page) => tabList(page).getByRole('tab'),
      description: 'Tabs in the tab list "Project".',
    },
    panels: { locate: panels, description: 'Elements with role="tabpanel", shown or hidden.' },
    ready: async (page) => {
      // index.html marks the component once createTabs has run.
      await page.locator('[data-tabs][data-ready="true"]').waitFor();
    },
    setup: setUpTabs({
      tab,
      fieldBefore: (page) => page.getByRole('textbox', { name: 'Project name' }),
      fieldAfter: (page) => page.getByRole('textbox', { name: 'Notes' }),
    }),
    resolveClickTarget: clicksNothing,
    readVersion: readReferenceVersion,
  };
}
