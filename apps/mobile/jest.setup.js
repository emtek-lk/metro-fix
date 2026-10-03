// Native modules have no implementation under Jest, so stub the ones the app imports.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestBackgroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 0, longitude: 0 } })),
  startLocationUpdatesAsync: jest.fn(async () => undefined),
  stopLocationUpdatesAsync: jest.fn(async () => undefined),
  hasStartedLocationUpdatesAsync: jest.fn(async () => false),
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(async () => false),
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(async () => undefined),
  canOpenURL: jest.fn(async () => true),
  createURL: jest.fn((path) => path),
}));

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(async () => ({ canceled: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('@expo/vector-icons/Feather', () => 'Feather');
jest.mock('react-native-webview', () => ({ WebView: 'WebView' }));
jest.mock('react-native-signature-canvas', () => 'SignatureCanvas');

// Without initial metrics SafeAreaProvider renders no children under Jest.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// Native view modules (glass, blur, gradient) have no JS implementation under Jest.
jest.mock('expo-glass-effect', () => ({
  GlassView: 'GlassView',
  GlassContainer: 'GlassContainer',
  isLiquidGlassAvailable: jest.fn(() => false),
  isGlassEffectAPIAvailable: jest.fn(() => false),
}));
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
