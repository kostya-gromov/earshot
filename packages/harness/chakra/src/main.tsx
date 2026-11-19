/*
 * Chakra UI v3 TagsInput, built as the "Basic" docs example
 * (apps/compositions/src/examples/tags-input-basic.tsx at tag @chakra-ui/react@3.38.0,
 * https://chakra-ui.com/docs/components/tags-input). Chakra's TagsInput is Ark UI's (Zag.js)
 * with Chakra styles. Props we set, and why:
 * - ChakraProvider with defaultSystem: Chakra components need their provider and a system.
 * - defaultValue with the reference's three people instead of "React", "Chakra", "TypeScript".
 * - Label "To" instead of "Tags"; no placeholder (the reference has none).
 * - The hint "Press Enter or Return to add tag" is kept, as in the example.
 * The basic example has no suggestion list: the tags input takes free text. The "with combobox"
 * example adds one, but the rules measured here do not depend on suggestions.
 * Everything else is the component's default.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, Span, TagsInput, defaultSystem } from '@chakra-ui/react';
import { initialPeople } from '../../shared/people.ts';

function People() {
  return (
    <TagsInput.Root defaultValue={[...initialPeople]}>
      <TagsInput.Label>To</TagsInput.Label>
      <TagsInput.Control>
        <TagsInput.Items />
        <TagsInput.Input />
      </TagsInput.Control>
      <Span textStyle="xs" color="fg.muted" ms="auto">
        Press Enter or Return to add tag
      </Span>
    </TagsInput.Root>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ChakraProvider value={defaultSystem}>
        <People />
      </ChakraProvider>
    </StrictMode>,
  );
}
