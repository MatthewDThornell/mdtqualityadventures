import js from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

// TypeScript (tests/**/*.ts) isn't linted here: typescript-eslint's latest
// stable release caps its peer range below the typescript@7 this project
// runs (see package.json) — Prettier still formats those files fine since
// it doesn't need type info, just the AST.
export default [
  { ignores: ['dist/', 'playwright-report/', 'test-results/', 'blob-report/', 'automation/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'public/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  prettierConfig,
];
