/*
 * Chakra UI Combobox, built as the "Basic" docs example ("a searchable dropdown with single
 * selection", https://chakra-ui.com/docs/components/combobox). Its code is
 * apps/compositions/src/examples/combobox-basic.tsx in chakra-ui/chakra-ui, read on the main
 * branch on 2026-11-14 (not at the tag of the measured 3.38.0). Props we set, and why:
 * - useFilter({ sensitivity: "base" }) with `contains`, useListCollection with that filter,
 *   onInputValueChange calling filter, width "320px", and every part (Label, Control, Input,
 *   IndicatorGroup with ClearTrigger and Trigger, Portal, Positioner, Content, Empty "No items
 *   found", Item with ItemIndicator): as the example has them, word for word.
 * - initialItems: the six fruit every combobox target gets, instead of the example's frameworks.
 * - Label "Fruit" instead of "Select framework"; no placeholder (the reference has none).
 * - ChakraProvider with defaultSystem: Chakra components need their provider and a system.
 * Everything else is the component's default.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ChakraProvider,
  Combobox,
  Portal,
  defaultSystem,
  useFilter,
  useListCollection,
} from '@chakra-ui/react';
import { fruit } from '../../shared/fruit.ts';

const items = fruit.map((name) => ({ label: name, value: name.toLowerCase() }));

function Fruit() {
  // The example writes `const { contains } = useFilter(...)` and passes it on; the same call,
  // kept on its object so our lint rule about detached methods holds.
  const matcher = useFilter({ sensitivity: 'base' });
  const { collection, filter } = useListCollection({
    initialItems: items,
    filter: (text, query) => matcher.contains(text, query),
  });

  return (
    <Combobox.Root
      collection={collection}
      onInputValueChange={(e) => filter(e.inputValue)}
      width="320px"
    >
      <Combobox.Label>Fruit</Combobox.Label>
      <Combobox.Control>
        <Combobox.Input />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No items found</Combobox.Empty>
            {collection.items.map((item) => (
              <Combobox.Item item={item} key={item.value}>
                {item.label}
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ChakraProvider value={defaultSystem}>
        <Fruit />
      </ChakraProvider>
    </StrictMode>,
  );
}
