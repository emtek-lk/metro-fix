import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/layout';
import { themedStyles } from '../../theme/themedStyles';
import { useReduceMotion } from '../../theme/useReduceMotion';
import { haptics } from '../../lib/haptics';
import { Icon, type FeatherIconName } from './Icon';
import { GlassSurface } from './GlassSurface';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  tone: ToastTone;
  title?: string;
  message: string;
}

interface ToastApi {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const noop = () => undefined;
const ToastContext = createContext<{ toast: ToastMessage | null; dismiss: () => void; api: ToastApi }>({
  toast: null,
  dismiss: noop,
  api: { success: noop, error: noop, info: noop },
});

const DURATION: Record<ToastTone, number> = { success: 3000, info: 3500, error: 5000 };

/**
 * In-app feedback that replaces system alerts for outcomes ("Quote submitted", "Couldn't update").
 * Renders one glass pill at the top of the screen; a newer message replaces the current one.
 * Use `useToast()` anywhere below the provider.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const counter = useRef(0);

  const dismiss = useCallback(() => setToast(null), []);

  const show = useCallback((tone: ToastTone, message: string, title?: string) => {
    counter.current += 1;
    setToast({ id: counter.current, tone, title, message });
    if (tone === 'success') haptics.success();
    else if (tone === 'error') haptics.error();
    AccessibilityInfo.announceForAccessibility?.(title ? `${title}. ${message}` : message);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, title) => show('success', message, title),
      error: (message, title) => show('error', message, title),
      info: (message, title) => show('info', message, title),
    }),
    [show],
  );

  const value = useMemo(() => ({ toast, dismiss, api }), [toast, dismiss, api]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => useContext(ToastContext).api;

const TONE_ICON: Record<ToastTone, FeatherIconName> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
};

/**
 * Draws the current toast. The provider renders one at the app root; also render one inside any
 * `Modal`, because a native modal covers everything beneath it, including the root toast.
 */
export const ToastHost: React.FC = () => {
  const { toast, dismiss } = useContext(ToastContext);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  // Keep the last message mounted while the toast animates out.
  const [shown, setShown] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toast) {
      Animated.timing(progress, {
        toValue: 0,
        duration: reduceMotion ? 0 : 180,
        useNativeDriver: true,
      }).start(({ finished }) => finished && setShown(null));
      return undefined;
    }

    setShown(toast);
    if (reduceMotion) progress.setValue(1);
    else
      Animated.spring(progress, {
        toValue: 1,
        damping: 15,
        stiffness: 220,
        useNativeDriver: true,
      }).start();

    const timer = setTimeout(dismiss, DURATION[toast.tone]);
    return () => clearTimeout(timer);
  }, [toast, dismiss, progress, reduceMotion]);

  if (!shown) return null;

  const tint =
    shown.tone === 'success' ? colors.success : shown.tone === 'error' ? colors.danger : colors.info;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          top: insets.top + spacing.sm,
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        },
      ]}
    >
      <Pressable
        style={styles.pressable}
        onPress={dismiss}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={shown.title ? `${shown.title}. ${shown.message}` : shown.message}
        accessibilityHint="Double tap to dismiss"
      >
        <GlassSurface borderRadius={radius.xl} tintColor={colors.glassStrong} style={styles.glass}>
          <View style={styles.row}>
            <View style={[styles.iconDisc, { backgroundColor: tint }]}>
              <Icon name={TONE_ICON[shown.tone]} size={16} color={colors.white} />
            </View>
            <View style={styles.textCol}>
              {shown.title ? (
                <Text style={styles.title} numberOfLines={1}>
                  {shown.title}
                </Text>
              ) : null}
              <Text style={styles.message} numberOfLines={3}>
                {shown.message}
              </Text>
            </View>
          </View>
        </GlassSurface>
      </Pressable>
    </Animated.View>
  );
};

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: layout.screenPadding,
      right: layout.screenPadding,
      zIndex: 1000,
      alignItems: 'center',
    },
    pressable: {
      width: '100%',
      maxWidth: 420,
    },
    glass: {
      width: '100%',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    iconDisc: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...typography.bodyStrong,
      color: colors.text,
    },
    message: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  }),
);
