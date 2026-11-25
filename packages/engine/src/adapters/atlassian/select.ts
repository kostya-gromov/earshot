import { harnessRoot, harnessTarget } from '../harness-target.ts';
import { createSelectHarnessAdapter } from '../select/harness.ts';

/** Atlassian Select without search, rendered from @atlaskit/select by packages/harness/atlassian. */
export const createAtlassianSelectAdapter = (url: string) =>
  createSelectHarnessAdapter({
    id: 'atlassian',
    system: 'Atlassian',
    url,
    page: 'packages/harness/atlassian/select.html',
    // The page sets inputId="fruit-input"; without search it is a read-only input.
    select: (page) => harnessRoot(page).locator('#fruit-input'),
    label: (page) => harnessRoot(page).locator('label[for="fruit-input"]'),
    labelDescription: 'The page’s label "Fruit", linked to the input by htmlFor.',
    // react-select shows the value in its own element, named after the instance.
    shownValue: (page) => harnessRoot(page).locator('[id$="-single-value"]'),
  });

export const createAtlassianSelectTarget = () =>
  harnessTarget('atlassian', createAtlassianSelectAdapter, 'select.html');
