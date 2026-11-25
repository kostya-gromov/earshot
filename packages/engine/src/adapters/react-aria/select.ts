import { harnessRoot, harnessTarget } from '../harness-target.ts';
import { createSelectHarnessAdapter } from '../select/harness.ts';

/** React Aria Select, rendered from react-aria-components by packages/harness/react-aria. */
export const createReactAriaSelectAdapter = (url: string) =>
  createSelectHarnessAdapter({
    id: 'react-aria',
    system: 'React Aria',
    url,
    page: 'packages/harness/react-aria/select.html',
    // By element and attribute, not role and name: those are what the engine records.
    select: (page) => harnessRoot(page).locator('button[aria-haspopup="listbox"]'),
    // The class the component gives its Label; a hidden native select beside it has a label too.
    label: (page) => harnessRoot(page).locator('.react-aria-Label'),
    labelDescription: 'The Label "Fruit" of the Select.',
  });

export const createReactAriaSelectTarget = () =>
  harnessTarget('react-aria', createReactAriaSelectAdapter, 'select.html');
