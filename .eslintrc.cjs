// ESLint config for a vanilla JS, browser-based static site
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        Utils: 'readonly',
        ThaiQuiz: 'readonly',
        StorageService: 'readonly'
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      'no-var': 'off', // codebase uses var intentionally for older UA support
      'prefer-const': ['warn', { destructuring: 'all' }],
      'no-console': ['warn', { allow: ['error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-useless-escape': 'warn',
      curly: ['error', 'all'],
      yoda: ['error', 'never']
    }
  },
  {
    files: ['js/**/*.js'],
    rules: {}
  }
];
