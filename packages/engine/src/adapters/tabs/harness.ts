import type { Page } from '@playwright/test';
import type { TabsInteraction, TabsState } from '../../scenarios/tabs.ts';
import type { Adapter } from '../adapter.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';
import { clicksNothing, setUpTabs } from './setup.ts';

interface HarnessTabs {
  /** The measurement's file name; also the system's folder in packages/harness. */
  id: string;
  system: string;
  notes: string;
}

// Every harness page has one tab list in the root. Not found by name: Atlassian's TabList takes
// no label, and no rule judges the list's own name.
const tabList = (page: Page) => harnessRoot(page).getByRole('tablist');
const tab = (page: Page, name: string) => tabList(page).getByRole('tab', { name, exact: true });
// Panels a system keeps hidden are included; one it does not mount is simply not there.
const panels = (page: Page) => page.getByRole('tabpanel', { includeHidden: true });

/**
 * A system's tabs on its harness page. The pages are built alike on purpose (the same names, the
 * same panel content, the same fields), so what differs between systems is what the engine
 * records, not how it finds the parts.
 */
function createHarnessTabsAdapter(
  { id, system, notes }: HarnessTabs,
  url: string,
): Adapter<TabsState, TabsInteraction> {
  return {
    id,
    system,
    // 2 since 2026-11-19: the tab list is found without its name (Atlassian's takes none).
    version: 2,
    url,
    page: `packages/harness/${id}/tabs.html`,
    root: harnessRoot,
    items: {
      locate: (page) => tabList(page).getByRole('tab'),
      description: 'Elements with role="tab" in the tab list.',
    },
    panels: {
      locate: panels,
      description: 'Elements with role="tabpanel" on the page, shown or hidden.',
    },
    ready: (page) => tab(page, 'Overview').waitFor({ timeout: 20_000 }),
    setup: setUpTabs({
      tab,
      // The fields are siblings of the root on every harness page, not inside it.
      fieldBefore: (page) => page.getByRole('textbox', { name: 'Project name' }),
      fieldAfter: (page) => page.getByRole('textbox', { name: 'Notes' }),
    }),
    resolveClickTarget: clicksNothing,
    readVersion: readHarnessVersion,
    notes,
  };
}

export const createHarnessTabsTarget = (parts: HarnessTabs) => ({
  ...harnessTarget(parts.id, (url) => createHarnessTabsAdapter(parts, url), 'tabs.html'),
  id: parts.id,
});
