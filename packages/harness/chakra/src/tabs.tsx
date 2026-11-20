/*
 * Chakra UI Tabs, built as the "Usage" anatomy on https://chakra-ui.com/docs/components/tabs
 * (read 2026-11-19; the page header shows 3.38.0, the version installed): Tabs.Root, Tabs.List
 * with Tabs.Trigger and Tabs.Indicator, then Tabs.Content. Props we set, and why:
 * - defaultValue "overview" on Tabs.Root: the anatomy sets no value, and with none no tab is
 *   selected at first; every measured page starts with Overview active. The docs list the prop
 *   ("The initial selected tab value when rendered").
 * - aria-label "Project" on Tabs.List, as every measured tab list is named.
 * - A value on each Tabs.Trigger and Tabs.Content, which pairs them.
 * - ChakraProvider with defaultSystem: Chakra components need their provider and a system.
 * Everything else is the documented default: activationMode 'automatic', loopFocus true,
 * lazyMount and unmountOnExit false, hideMode 'display-none'.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, Tabs, defaultSystem } from '@chakra-ui/react';
import { panelContent, tabNames, type TabName } from '../../shared/tab-content.ts';

function TabContent({ name }: { name: TabName }) {
  const { link, text } = panelContent[name];
  return (
    <p>
      {link && <a href={link.href}>{link.text}</a>}
      {text}
    </p>
  );
}

const valueOf = (name: string) => name.toLowerCase();

function Project() {
  return (
    <Tabs.Root defaultValue="overview">
      <Tabs.List aria-label="Project">
        {tabNames.map((name) => (
          <Tabs.Trigger key={name} value={valueOf(name)}>
            {name}
          </Tabs.Trigger>
        ))}
        <Tabs.Indicator />
      </Tabs.List>
      {tabNames.map((name) => (
        <Tabs.Content key={name} value={valueOf(name)}>
          <TabContent name={name} />
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ChakraProvider value={defaultSystem}>
        <Project />
      </ChakraProvider>
    </StrictMode>,
  );
}
