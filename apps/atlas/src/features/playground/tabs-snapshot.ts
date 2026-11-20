import type { TabsSnapshot } from './tabs-tour';

/** Reads the mounted reference tabs: the tab with focus, the selected tab, focus in the panel. */
export function snapshotTabs(root: HTMLElement): TabsSnapshot {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const focused = document.activeElement;
  const nameOf = (tab: Element | undefined) => tab?.textContent?.trim() ?? null;
  const panel = root.querySelector('[role="tabpanel"]:not([hidden])');
  return {
    names: tabs.map((tab) => tab.textContent?.trim() ?? ''),
    focused: nameOf(tabs.find((tab) => tab === focused)),
    selected: nameOf(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')),
    focusInPanel: panel !== null && focused !== null && panel.contains(focused),
  };
}
