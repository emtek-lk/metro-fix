import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, layout } from '../../theme/layout';
import { themedStyles } from '../../theme/themedStyles';
import { GlassSurface } from './GlassSurface';

/** Height of the compact bar, excluding the status-bar inset. */
export const GLASS_HEADER_HEIGHT = 48;
/** How far the content scrolls before the compact bar starts to appear. */
const REVEAL_START = 36;
const REVEAL_DISTANCE = 28;

/**
 * Scroll plumbing for a large title that collapses into a compact glass bar. Pass `onScroll` to an
 * `Animated.ScrollView` / `Animated.FlatList` (with `scrollEventThrottle={16}`) and `scrollY` to
 * `GlassHeader`.
 */
export function useCollapsingHeader() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: Platform.OS !== 'web',
      }),
    [scrollY],
  );
  return { scrollY, onScroll };
}

export interface GlassHeaderProps {
  /** Compact title, shown once the large title has scrolled away. */
  title: string;
  scrollY: Animated.Value;
  /** Optional trailing control (e.g. an IconButton), shown with the compact bar. */
  right?: React.ReactNode;
}

/**
 * A glass bar pinned to the top that fades in as the screen's large title scrolls away. It reaches
 * up under the status bar, so render it inside the safe-area container and above the scroll view.
 */
export const GlassHeader: React.FC<GlassHeaderProps> = ({ title, scrollY, right }) => {
  const insets = useSafeAreaInsets();
  // The bar only takes touches once it is visible, so it never blocks the large title's controls.
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const next = value > REVEAL_START + REVEAL_DISTANCE / 2;
      setInteractive((prev) => (prev === next ? prev : next));
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const opacity = scrollY.interpolate({
    inputRange: [REVEAL_START, REVEAL_START + REVEAL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const translateY = scrollY.interpolate({
    inputRange: [REVEAL_START, REVEAL_START + REVEAL_DISTANCE],
    outputRange: [-8, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          top: -insets.top,
          height: insets.top + GLASS_HEADER_HEIGHT,
          opacity,
          transform: [{ translateY }],
          pointerEvents: interactive ? 'box-none' : 'none',
        },
      ]}
    >
      <GlassSurface borderRadius={0} shadow={false} style={styles.glass}>
        <View style={[styles.row, { paddingTop: insets.top }]}>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      </GlassSurface>
    </Animated.View>
  );
};

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 60,
    },
    glass: {
      flex: 1,
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      gap: spacing.md,
    },
    title: {
      ...typography.bodyStrong,
      flex: 1,
      color: colors.text,
    },
    right: {
      flexShrink: 0,
    },
  }),
);
