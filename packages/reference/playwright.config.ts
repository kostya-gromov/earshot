import { defineConfig } from '@playwright/test';

const port = 4173;

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.ts',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    // Same fixed context the engine uses (packages/engine/CLAUDE.md, One run).
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  // Not devices['Desktop Chrome']: its 1280×720 viewport would override the fixed context above.
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'node scripts/serve.ts',
    url: `http://localhost:${port}/input-with-chips/`,
    reuseExistingServer: !process.env.CI,
  },
});
