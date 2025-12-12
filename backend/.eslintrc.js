module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  plugins: ['prettier', 'import'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
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
  overrides: [
    {
      files: ['**/tests/**/*.js', '**/*.test.js'],
      parserOptions: {
        sourceType: 'module',
      },
    },
    {
      files: ['tests/load/**/*.js'],
      rules: {
        'import/no-unresolved': 'off',
        'no-undef': 'off', // ENV is defined by k6
      },
    },
    {
      files: ['src/errors/custom-errors.js'],
      rules: {
        'max-classes-per-file': 'off',
      },
    },
    {
      files: ['src/scripts/**/*.js'],
      rules: {
        'no-console': 'off',
        'no-await-in-loop': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'coverage/', 'dist/', '*.log'],
};
