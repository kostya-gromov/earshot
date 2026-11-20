/*
 * React Aria Tabs, built as the first example on https://react-aria.adobe.com/Tabs (read
 * 2026-11-19, react-aria-components 1.22.1). The example renders the docs' vanilla starter
 * wrappers, which add styles and a SelectionIndicator; we use the components they wrap, from the
 * published package. Props we set, and why:
 * - Tabs with no props, as in the example: keyboardActivation stays at its documented default,
 *   'automatic' ("Whether tabs are activated automatically on focus or manually").
 * - TabList aria-label "Project" (the example's is "Settings"), Tab and TabPanel ids shared, as
 *   the example pairs them.
 * - The four tabs and panels every tabs target gets, instead of the example's four with form
 *   controls in each panel: the rule "Tab reaches the shown panel" needs panels whose first
 *   content is known.
 * - Styles: none of the starter CSS; react-aria-components ships unstyled.
 * Everything else is the component's default: inactive TabPanels are not mounted
 * (shouldForceMount, default false), and nothing here sets a tabIndex on a panel.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'react-aria-components';
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

function Project() {
  return (
    <Tabs>
      <TabList aria-label="Project">
        {tabNames.map((name) => (
          <Tab key={name} id={name}>
            {name}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {tabNames.map((name) => (
          <TabPanel key={name} id={name}>
            <TabContent name={name} />
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Project />
    </StrictMode>,
  );
}
