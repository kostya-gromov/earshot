import { createHarnessMenuTarget } from './harness-adapter.ts';

// One entry per measured system; how each page was built is said in the page's own source.
export const createFluentMenuTarget = () =>
  createHarnessMenuTarget({
    id: 'fluent',
    system: 'Fluent 2',
    notes:
      'Menu and MenuTrigger around a MenuButton, with MenuPopover, MenuList and MenuItem, as in the Default story of MenuButton; the third item has the disabled prop.',
  });

/** A variant of Fluent 2, not a system of its own: the Menu docs' first example (ADR 0005). */
export const createFluentDefaultStoryMenuTarget = () =>
  createHarnessMenuTarget({
    id: 'fluent-default-story',
    system: 'Fluent 2',
    notes:
      'A variant, not counted: Menu and MenuTrigger around a plain Button, as in the Default story of Menu. The counted Fluent 2 page uses MenuButton.',
    page: { folder: 'fluent', file: 'menu-button-default-story.html' },
  });

export const createChakraMenuTarget = () =>
  createHarnessMenuTarget({
    id: 'chakra',
    system: 'Chakra UI',
    notes:
      'Menu.Root with Menu.Trigger around a Button and the content in a Portal, as in the Basic example; the third item has the disabled prop.',
  });

export const createReactAriaMenuTarget = () =>
  createHarnessMenuTarget({
    id: 'react-aria',
    system: 'React Aria',
    notes:
      'MenuTrigger around a Button and a Popover that holds the Menu, as the docs starter renders it; the third item has isDisabled.',
  });

export const createMuiMenuTarget = () =>
  createHarnessMenuTarget({
    id: 'mui',
    system: 'MUI',
    notes:
      'A Button wired to a Menu by the page, as in the Basic menu demo: Material UI documents no ready-made menu button. The third item has the disabled prop.',
  });

export const createAtlassianMenuTarget = () =>
  createHarnessMenuTarget({
    id: 'atlassian',
    system: 'Atlassian',
    notes:
      'DropdownMenu with a string trigger and shouldRenderToParent around one DropdownItemGroup, as in the Default example; the third item has isDisabled.',
  });

export const createPrimerMenuTarget = () =>
  createHarnessMenuTarget({
    id: 'primer',
    system: 'GitHub Primer',
    notes:
      'ActionMenu with ActionMenu.Button and an ActionList in ActionMenu.Overlay, as in the Default story; the third item has the disabled prop, not inactiveText.',
  });
