// @ts-check
// Enforces docs/engineering-standards.md. If a rule fights clarity, raise it in the PR; do not disable it inline.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const TESTS = ['**/test/**', '**/*.test.ts', '**/*.spec.ts'];
const CONFIGS = ['*.config.{js,ts}', '**/*.config.{js,ts}', 'eslint.config.js'];

/** Every package is used through its index; reaching into another package's files couples to internals. */
const NO_DEEP_IMPORTS = {
  group: ['@earshot/*/src/*', '@earshot/*/src/**'],
  message: 'Import from the package entry point, not its internals.',
};

/**
 * Layer boundaries from engineering-standards.md section 1. Each block lists everything a layer
 * may not import, because a later `no-restricted-imports` replaces an earlier one for the same file.
 */
const boundary = (
  /** @type {string[]} */ files,
  /** @type {{ group: string[]; message: string }[]} */ patterns,
) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns: [NO_DEEP_IMPORTS, ...patterns] }] },
});

export default tseslint.config(
  {
    // docs/design holds throwaway design spikes (D0), not production code.
    ignores: [
      '**/node_modules/',
      '**/.next/',
      '**/out/',
      '**/dist/',
      'docs/prototype/',
      'docs/design/',
      // Design review captures and HTML sketches (2026-11-10): throwaway, like docs/design.
      'design-review/',
      // Hidden tests of golden tasks are copied into eval workspaces and compiled there, not here.
      'evals/golden/tasks/',
      'evals/results/',
      '**/test-results/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Size and shape (section 2): a limit hit is a signal to split by responsibility.
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      'max-nested-callbacks': ['error', 3],

      // Style (section 3)
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: { direct: true, named: true, defaultFrom: true, namedFrom: true },
        },
      ],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-param-reassign': 'error',

      // Types (section 4)
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // Callbacks as properties: method shorthand has bivariant parameters and loses `this` when destructured.
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],

      'no-restricted-imports': ['error', { patterns: [NO_DEEP_IMPORTS] }],
    },
  },

  // ---- Layer boundaries (section 1) ----
  boundary(
    ['packages/contracts/src/**'],
    [
      {
        group: ['node:*', 'fs', 'path', 'playwright', '@playwright/*', 'yaml'],
        message: 'contracts is pure: no I/O and no parsers; scripts/ reads files.',
      },
      {
        group: ['@earshot/*'],
        message: 'contracts is the bottom layer and imports no other package.',
      },
    ],
  ),
  boundary(
    ['packages/reference/input-with-chips/**'],
    [
      {
        group: ['@earshot/*', 'node:*', 'fs', 'path'],
        message: 'Reference implementations are self-contained browser code.',
      },
    ],
  ),
  // Order matters: the general engine block comes first so the stricter core block wins for core files.
  boundary(
    ['packages/engine/src/**'],
    [
      {
        group: ['@earshot/atlas', '@earshot/atlas/*'],
        message: 'The engine never depends on the site.',
      },
    ],
  ),
  boundary(
    ['packages/engine/src/{evaluators,speech,diff,model}/**'],
    [
      {
        group: [
          'node:*',
          'fs',
          'path',
          'playwright',
          '@playwright/*',
          '**/capture/**',
          '**/adapters/**',
          '**/registry/**',
          '**/runner/**',
          '**/scenarios/**',
          '**/suites/**',
          '**/cli/**',
        ],
        message:
          'Functional core: pure functions over recorded data. Do I/O in the shell and pass data in.',
      },
      {
        group: ['@earshot/atlas', '@earshot/atlas/*'],
        message: 'The engine never depends on the site.',
      },
    ],
  ),
  {
    // In-page scripts are injected one by one as classic scripts: a runtime import would break them.
    files: ['packages/engine/src/capture/page/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*', '**'],
              allowTypeImports: true,
              message: 'In-page scripts must be self-contained; only type imports are allowed.',
            },
          ],
        },
      ],
    },
  },
  boundary(
    ['apps/atlas/src/ui/**'],
    [
      {
        group: ['**/features/**', '**/data/**'],
        message: 'ui/ primitives carry no domain knowledge.',
      },
    ],
  ),

  // ---- Exemptions ----
  {
    files: TESTS,
    // A describe block is long by nature; readability still applies.
    rules: {
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      'max-lines': ['error', 400],
    },
  },
  {
    // Frameworks and tools require default exports here.
    files: [...CONFIGS, 'apps/atlas/src/app/**'],
    rules: { 'no-restricted-exports': 'off' },
  },
  {
    // Root config files live outside every package tsconfig, so lint them without type info.
    files: ['*.js', '*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['*.js'],
    languageOptions: { globals: globals.node },
  },
);
