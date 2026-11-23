import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { harnessConfig } from '../shared/harness-config.ts';

const { plugin, ...config } = harnessConfig({
  from: import.meta.url,
  system: 'primer',
  measuredPackage: '@primer/react',
  pages: ['index.html', 'combobox.html', 'menu-button.html', 'dialog.html'],
});

export default defineConfig({ ...config, plugins: [react(), plugin] });
