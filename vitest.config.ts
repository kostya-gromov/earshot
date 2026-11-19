import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'contracts',
          root: './packages/contracts',
          include: ['test/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'engine',
          root: './packages/engine',
          include: ['test/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'atlas',
          root: './apps/atlas',
          // Pure modules only; *.spec.ts are Playwright tests against the static export.
          include: ['test/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'reference',
          root: './packages/reference',
          // *.spec.ts are Playwright browser tests, run by `pnpm test:e2e`.
          include: ['test/**/*.test.ts'],
        },
      },
    ],
  },
});
