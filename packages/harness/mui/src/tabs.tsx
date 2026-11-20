/*
 * MUI Tabs, built as the "Basic tabs" demo on https://mui.com/material-ui/react-tabs/ (read
 * 2026-11-19). Its code is docs/data/material/components/tabs/BasicTabs.tsx in mui/material-ui at
 * the tag of the measured version, v9.5.0, read that day (on master it has since moved to
 * demos/basic/BasicTabs.tsx, unchanged in the panel). @mui/material ships no tab panel: the demo defines CustomTabPanel and
 * a11yProps itself, so this is a docs composition (ADR 0006). Props we set, and why:
 * - CustomTabPanel and a11yProps as the demo writes them: role "tabpanel", hidden when not
 *   selected, tabIndex 0, an id, aria-labelledby to the tab; the tab gets an id and aria-controls.
 * - Tabs with value and onChange held in state, as in the demo; aria-label "Project" instead of
 *   "basic tabs example".
 * - The four tabs and panels every tabs target gets, instead of the demo's three.
 * - The demo's Box wrappers and padding are left out: layout only.
 * Everything else is the default: manual activation (the docs: the components implement keyboard
 * navigation with "manual activation"; selectionFollowsFocus is not set). The @mui/lab TabPanel
 * the docs call experimental is not installed and not measured.
 */
import { StrictMode, useState, type ReactNode, type SyntheticEvent } from 'react';
import { createRoot } from 'react-dom/client';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
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

function CustomTabPanel({
  children,
  value,
  index,
}: {
  children: ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      tabIndex={0}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && <div>{children}</div>}
    </div>
  );
}

const a11yProps = (index: number) => ({
  id: `simple-tab-${index}`,
  'aria-controls': `simple-tabpanel-${index}`,
});

function Project() {
  const [value, setValue] = useState(0);
  const handleChange = (_event: SyntheticEvent, newValue: number) => setValue(newValue);
  return (
    <div>
      <Tabs value={value} onChange={handleChange} aria-label="Project">
        {tabNames.map((name, index) => (
          <Tab key={name} label={name} {...a11yProps(index)} />
        ))}
      </Tabs>
      {tabNames.map((name, index) => (
        <CustomTabPanel key={name} value={value} index={index}>
          <TabContent name={name} />
        </CustomTabPanel>
      ))}
    </div>
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
