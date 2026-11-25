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
      testIgnore: ['visual/**', 'panel-invariants.spec.ts', 'code-lens-invariants.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // The panel's invariants measure pixels after motion settles, page by page. Under load from other browser work on the machine (a design review,
      // other sessions) six of them hit the 90 s test timeout on 2026-11-24, with no invariant
      // broken; alone, and in two full runs at ordinary load, all passed. At most three at a
      // time, so they never compete with the rest of the suite for every core.
      name: 'invariants',
      testMatch: ['panel-invariants.spec.ts', 'code-lens-invariants.spec.ts'],
      workers: 3,
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
