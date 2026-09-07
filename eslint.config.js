// ESLint flat config. Two environments: browser scripts under assets/js, and
// Node (CommonJS) for the Netlify functions, their shared lib, and the tests.
const js = require('@eslint/js');

const rules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': ['error', { args: 'none' }],
  eqeqeq: 'error',
  'no-var': 'error',
  'prefer-const': 'error'
};

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  URLSearchParams: 'readonly',
  Buffer: 'readonly'
};

const nodeGlobals = {
  require: 'readonly',
  module: 'writable',
  exports: 'writable',
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  fetch: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  __dirname: 'readonly'
};

module.exports = [
  { ignores: ['_site/**', 'node_modules/**', 'vendor/**', 'assets/data/**'] },
  {
    files: ['assets/js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: browserGlobals },
    rules
  },
  {
    files: ['netlify/**/*.js', 'tests/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: nodeGlobals },
    rules
  }
];
