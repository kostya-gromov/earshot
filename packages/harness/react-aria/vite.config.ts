import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { harnessConfig } from '../shared/harness-config.ts';

const { plugin, ...config } = harnessConfig({
  from: import.meta.url,
  system: 'react-aria',
  measuredPackage: 'react-aria-components',
  pages: ['index.html', 'combobox.html', 'menu-button.html'],
});

export default defineConfig({ ...config, plugins: [react(), plugin] });
