import { harnessRoot, harnessTarget } from '../harness-target.ts';
import { createSelectHarnessAdapter } from '../select/harness.ts';

/** Chakra UI Select, rendered from @chakra-ui/react by packages/harness/chakra. */
export const createChakraSelectAdapter = (url: string) =>
  createSelectHarnessAdapter({
    id: 'chakra',
    system: 'Chakra UI',
    url,
    page: 'packages/harness/chakra/select.html',
    // The data attributes Zag gives each part: stable, and not what the engine records.
    select: (page) => harnessRoot(page).locator('[data-scope="select"][data-part="trigger"]'),
    label: (page) => harnessRoot(page).locator('[data-scope="select"][data-part="label"]'),
    labelDescription: 'The Select.Label "Fruit".',
  });

export const createChakraSelectTarget = () =>
  harnessTarget('chakra', createChakraSelectAdapter, 'select.html');
