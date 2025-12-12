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
        'no-console': 'off',
        'func-names': 'off',
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
    {
      files: ['tests/performance/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['tests/unit/**/*.js'],
      rules: {
        'global-require': 'off',
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        camelcase: 'off',
        'no-shadow': 'off',
        'no-continue': 'off',
        'no-lonely-if': 'off',
        'no-underscore-dangle': 'off',
      },
    },
    {
      files: ['src/services/**/*.js', 'src/websocket/**/*.js', 'src/app.js', 'src/server.js'],
      rules: {
        camelcase: [
          'error',
          {
            properties: 'never',
            ignoreDestructuring: false,
            allow: [
              'user_id',
              'field_id',
              'sharedWithuser_id',
              'actoruser_id',
              'targetuser_id',
              'user_ids',
              'rain_3d_mm',
              'rain_7d_mm',
              'WATERrain_mmMIN',
              'totalcount',
            ],
          },
        ],
        'no-console': 'off',
        'no-await-in-loop': 'off',
        'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
        'no-plusplus': 'off',
        'no-continue': 'off',
        'no-restricted-globals': ['error', 'isFinite', 'isNaN'].concat(
          process.browser ? [] : ['window', 'document', 'navigator', 'fetch']
        ),
        'no-promise-executor-return': 'off',
        'no-nested-ternary': 'off',
        'no-shadow': 'off',
        'global-require': 'off',
        'import/no-unresolved': 'off',
        'no-return-await': 'off',
        'no-param-reassign': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'coverage/', 'dist/', '*.log'],
};
