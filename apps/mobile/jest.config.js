module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Resolve Worklets to its JS implementation (it has no native module under Jest).
  resolver: 'react-native-worklets/jest/resolver',
  // Expo / React Native packages ship untranspiled ES modules and must go through babel.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|react-native-worklets|react-native-gesture-handler|@metro-fix/.*))',
  ],
};
