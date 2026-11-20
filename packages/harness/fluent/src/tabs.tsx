/*
 * Fluent 2 TabList, built as the "With Panels" story ("A tab list can be used to show/hide UI when
 * a tab is selected"): stories/src/Tabs/TabListWithPanels.stories.tsx in microsoft/fluentui, read
 * on 2026-11-19 at the tag of the measured version, @fluentui/react-components_v9.75.2 (commit
 * 485355d, where @fluentui/react-tabs is 9.12.6). Fluent ships no tab panel component: the story
 * renders its own `div role="tabpanel"`, so this is a docs composition (ADR 0006). Props we set,
 * and why:
 * - TabList with selectedValue and onTabSelect held in state, as in the story.
 * - Tab with an id and a value, as in the story; each panel's aria-labelledby names the tab's id,
 *   and only the selected panel is rendered, as the story does it. No aria-controls: the story
 *   has none. No icons.
 * - aria-label "Project" on TabList: the story's list has no name; every measured list is named,
 *   and no rule judges the list's own name.
 * - The four tabs and panels every tabs target gets, instead of the story's three tables.
 * - FluentProvider with webLightTheme: Fluent components need their provider and a theme.
 * Everything else is the default: selectTabOnFocus is false ("When true, focusing a tab will
 * select it. @default false", in the installed types).
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FluentProvider,
  Tab,
  TabList,
  webLightTheme,
  type SelectTabData,
  type SelectTabEvent,
  type TabValue,
} from '@fluentui/react-components';
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
  const [selectedValue, setSelectedValue] = useState<TabValue>('Overview');
  const onTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value);
  };
  return (
    <div>
      <TabList aria-label="Project" selectedValue={selectedValue} onTabSelect={onTabSelect}>
        {tabNames.map((name) => (
          <Tab key={name} id={name} value={name}>
            {name}
          </Tab>
        ))}
      </TabList>
      <div>
        {tabNames
          .filter((name) => name === selectedValue)
          .map((name) => (
            <div key={name} role="tabpanel" aria-labelledby={name}>
              <TabContent name={name} />
            </div>
          ))}
      </div>
    </div>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <FluentProvider theme={webLightTheme}>
        <Project />
      </FluentProvider>
    </StrictMode>,
  );
}
