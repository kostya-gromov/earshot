import { defineConfig, devices } from '@playwright/test';

// Tests run against the static export, the same files that get deployed.
const port = 4202;

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      testIgnore: 'visual/**',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Visual regression runs on its own (pnpm test:visual): baselines are per platform.
      name: 'visual',
      testMatch: 'visual/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // CI never writes a baseline it was not given; locally, a new snapshot is written once.
  updateSnapshots: process.env.CI ? 'none' : 'missing',
  webServer: {
    command: `node ../../packages/reference/scripts/serve.ts --port ${port} --root out --home /`,
    port,
    reuseExistingServer: !process.env.CI,
  },
});
