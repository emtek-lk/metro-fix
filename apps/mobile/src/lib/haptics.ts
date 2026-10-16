import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Light haptic feedback for key actions. Every call is fire-and-forget and silently does nothing
 * where haptics are unavailable (web, simulators without a Taptic Engine, devices that disable it).
 */
const run = (feedback: () => Promise<void>): void => {
  if (Platform.OS === 'web') return;
  try {
    feedback().catch(() => undefined);
  } catch {
    // Haptics are a nicety; never let them break an action.
  }
};

export const haptics = {
  /** A button press or a light confirmation. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Moving between tabs or options. */
  select: () => run(() => Haptics.selectionAsync()),
  /** An action went through (accepted a job, status advanced, proof submitted). */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something needs attention (new dispatch alert). */
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** An action failed. */
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
