'use strict';

const js = require('@eslint/js');
const prettier = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');
const globals = require('globals');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.es2022,
        ...globals.jest,
      },
    },

    plugins: {
      prettier,
      import: importPlugin,
    },

    ...js.configs.recommended,

    rules: {
      'prettier/prettier': 'error',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'class-methods-use-this': 'off',
      'consistent-return': 'off',
      'import/prefer-default-export': 'off',

      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['**/tests/**', '**/*.test.js', '**/jest.config.js'] },
      ],
    },

    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.json'],
        },
      },
    },

    ignores: ['node_modules/', 'coverage/', 'dist/', '*.log'],
  },
];
