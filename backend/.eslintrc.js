'use strict';

module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  plugins: ['prettier', 'import'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.json'],
      },
    },
  },
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
  ignorePatterns: ['node_modules/', 'coverage/', 'dist/', '*.log'],
};
