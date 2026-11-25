/*
 * Chakra UI Select, built as the "Basic" docs example (https://chakra-ui.com/docs/components/select
 * shows only the anatomy; the example's code is apps/compositions/src/examples/select-basic.tsx
 * in chakra-ui/chakra-ui, read on the main branch on 2026-11-24, not at the tag of the measured
 * 3.38.0). Props we set, and why:
 * - createListCollection, size "sm", width "320px", and every part (HiddenSelect, Label, Control,
 *   Trigger with ValueText, IndicatorGroup with Indicator, Portal, Positioner, Content, Item with
 *   ItemIndicator): as the example has them.
 * - items: the five fruit every select target gets, instead of the example's frameworks, with
 *   Banana chosen (defaultValue).
 * - Label "Fruit" instead of "Select framework"; no placeholder (the reference has none, and a
 *   chosen value hides it).
 * - ChakraProvider with defaultSystem: Chakra components need their provider and a system.
 * Everything else is the component's default.
 * Not followed: NativeSelect, the browser's own select (data/targets.yaml).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ChakraProvider,
  Portal,
  Select,
  createListCollection,
  defaultSystem,
} from '@chakra-ui/react';
import { selectFruit, selectValue } from '../../shared/select-fruit.ts';

const fruit = createListCollection({
  items: selectFruit.map((name) => ({ label: name, value: name.toLowerCase() })),
});

function Fruit() {
  return (
    <Select.Root
      collection={fruit}
      size="sm"
      width="320px"
      defaultValue={[selectValue.toLowerCase()]}
    >
      <Select.HiddenSelect />
      <Select.Label>Fruit</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {fruit.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                {item.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
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
