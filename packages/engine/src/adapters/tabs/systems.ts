import { createHarnessTabsTarget } from './harness.ts';

// One entry per measured system; how each page was built is said in the page's own source.
export const createReactAriaTabsTarget = () =>
  createHarnessTabsTarget({
    id: 'react-aria',
    system: 'React Aria',
    notes:
      'Tabs with a TabList of four Tab and TabPanels of four TabPanel, as in the first docs example, with no props on Tabs (keyboardActivation stays automatic).',
  });

export const createChakraTabsTarget = () =>
  createHarnessTabsTarget({
    id: 'chakra',
    system: 'Chakra UI',
    notes:
      'Tabs.Root with defaultValue, Tabs.List of four Tabs.Trigger and a Tabs.Indicator, and four Tabs.Content, as in the docs anatomy; activationMode and loopFocus at their defaults.',
  });

export const createFluentTabsTarget = () =>
  createHarnessTabsTarget({
    id: 'fluent',
    system: 'Fluent 2',
    notes:
      'Docs composition, assembled by Atlas: TabList with Tab, and panels as the With Panels story renders them (div role="tabpanel" with aria-labelledby, only the selected one rendered); selectTabOnFocus at its default, false.',
  });

export const createMuiTabsTarget = () =>
  createHarnessTabsTarget({
    id: 'mui',
    system: 'MUI',
    notes:
      'Docs composition, assembled by Atlas: Tabs with Tab, and CustomTabPanel and a11yProps as the Basic tabs demo defines them; manual activation, the documented default (selectionFollowsFocus not set).',
  });

export const createAtlassianTabsTarget = () =>
  createHarnessTabsTarget({
    id: 'atlassian',
    system: 'Atlassian',
    notes:
      'Tabs with an id, a TabList of four Tab and four TabPanel, as in the Default example; no prop sets the activation mode, and the tab list has no name (TabList takes children only).',
  });
