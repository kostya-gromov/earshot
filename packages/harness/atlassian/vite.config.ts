import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { harnessConfig } from '../shared/harness-config.ts';

const { plugin, ...config } = harnessConfig({
  from: import.meta.url,
  system: 'atlassian',
  measuredPackage: '@atlaskit/select',
  pages: [
    'index.html',
    'combobox.html',
    'menu-button.html',
    'tabs.html',
    'dialog.html',
    'select.html',
  ],
  packageByPage: {
    'menu-button.html': '@atlaskit/dropdown-menu',
    'tabs.html': '@atlaskit/tabs',
    'dialog.html': '@atlaskit/modal-dialog',
  },
});

export default defineConfig({ ...config, plugins: [react(), plugin] });
