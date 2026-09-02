import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/layout';

interface SkeletonBarProps {
  width: ViewStyle['width'];
  height?: number;
  opacity: Animated.AnimatedInterpolation<number>;
}

const SkeletonBar: React.FC<SkeletonBarProps> = ({ width, height = 12, opacity }) => (
  <Animated.View
    style={[styles.bar, { width, height, borderRadius: height / 2, opacity }]}
  />
);

export interface SkeletonCardProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Pulsing placeholder shown while a list loads, in place of a bare spinner.
 * Purely decorative — it holds no data and triggers no fetching.
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <SkeletonBar width={72} height={10} opacity={opacity} />
        <SkeletonBar width={88} height={22} opacity={opacity} />
      </View>

      <SkeletonBar width="72%" height={16} opacity={opacity} />
      <SkeletonBar width="94%" height={10} opacity={opacity} />
      <SkeletonBar width="60%" height={10} opacity={opacity} />

      <View style={styles.chipRow}>
        <SkeletonBar width={84} height={22} opacity={opacity} />
        <SkeletonBar width={100} height={22} opacity={opacity} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  bar: {
    backgroundColor: colors.surfaceRaised,
  },
});
