import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { harnessConfig } from '../shared/harness-config.ts';

const { plugin, ...config } = harnessConfig({
  from: import.meta.url,
  system: 'atlassian',
  measuredPackage: '@atlaskit/select',
  pages: ['index.html', 'combobox.html', 'menu-button.html'],
  packageByPage: { 'menu-button.html': '@atlaskit/dropdown-menu' },
});

export default defineConfig({ ...config, plugins: [react(), plugin] });
