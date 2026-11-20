/*
 * Atlassian Tabs, built as the "Default" example on https://atlassian.design/components/tabs/examples
 * ("The default form of tabs.", read 2026-11-19), with @atlaskit/tabs 21.3.1 from npm. Imports by
 * component path, as the example does. Props we set, and why:
 * - Tabs with an id (required: "used to generate IDs for tabs and tab panels") and nothing else
 *   that changes behavior: no defaultSelected, so the first tab is selected ("If not set the
 *   first tab will be displayed by default"), and no selected, as in the uncontrolled example.
 *   The example's onChange only logs, so it is left out.
 * - No name on the tab list: the example's has none, and the installed TabList types accept
 *   children only. No rule judges the list's own name.
 * - The four tabs and panels every tabs target gets, instead of the example's three; the
 *   example's styled Panel wrapper is left out (layout only).
 * Everything else is the default: there is no prop for the activation mode, and panels stay
 * mounted after they were selected (shouldUnmountTabPanelOnChange not set).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Tab from '@atlaskit/tabs/tab';
import TabList from '@atlaskit/tabs/tab-list';
import TabPanel from '@atlaskit/tabs/tab-panel';
import Tabs from '@atlaskit/tabs/tabs';
import { panelContent, tabNames, type TabName } from '../../shared/tab-content.ts';

// Rendered per page, not shared: each system's page type-checks with its own React.
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
    <Tabs id="project">
      <TabList>
        {tabNames.map((name) => (
          <Tab key={name}>{name}</Tab>
        ))}
      </TabList>
      {tabNames.map((name) => (
        <TabPanel key={name}>
          <TabContent name={name} />
        </TabPanel>
      ))}
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
