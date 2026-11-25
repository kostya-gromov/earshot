import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { harnessConfig } from '../shared/harness-config.ts';

const { plugin, ...config } = harnessConfig({
  from: import.meta.url,
  system: 'chakra',
  measuredPackage: '@chakra-ui/react',
  pages: [
    'index.html',
    'combobox.html',
    'menu-button.html',
    'tabs.html',
    'dialog.html',
    'select.html',
  ],
});

export default defineConfig({ ...config, plugins: [react(), plugin] });
