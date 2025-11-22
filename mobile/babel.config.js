module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.js', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@api': './src/api',
          '@hooks': './src/hooks',
          '@store': './src/store',
          '@utils': './src/utils',
          '@config': './src/config',
          '@types': './src/types',
          '@assets': './assets',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};

