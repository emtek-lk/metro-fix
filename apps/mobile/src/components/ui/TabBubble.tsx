import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/layout';
import { themedStyles } from '../../theme/themedStyles';
import { useTheme } from '../../theme/ThemeProvider';

export interface TabBubbleProps {
  /** Shifts the highlight against the drag direction, so it seems to lag behind the lens. */
  lean?: SharedValue<number>;
}

/**
 * The lens under the active tab, styled per platform. On iOS and web it is deliberately plain: a neutral translucent body, a thin
 * light edge and one soft highlight along the top, like light catching a drop of water. It has no
 * colours of its own, so it picks up whatever sits behind it. On iOS 26+ the body is the system's
 * native Liquid Glass.
 */
export const TabBubble: React.FC<TabBubbleProps> = ({ lean }) => {
  const { scheme, reduceTransparency } = useTheme();
  const leanStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lean ? lean.get() : 0 }] }));

  // Android: Material 3 style. A solid tonal capsule behind the active tab; no gloss, no blur.
  if (Platform.OS === 'android') {
    return <View style={[styles.fill, styles.tonal]} />;
  }

  const nativeGlass = Platform.OS === 'ios' && !reduceTransparency && isLiquidGlassAvailable();

  return (
    <View style={styles.fill}>
      {/* The faint body sits under the glass so the lens still reads on a light bar. */}
      <View style={[StyleSheet.absoluteFill, styles.body]} />

      {nativeGlass ? (
        <GlassView
          glassEffectStyle="clear"
          colorScheme={scheme}
          isInteractive
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* Native glass already has its own specular highlight; only draw ours where it doesn't. */}
      {nativeGlass ? null : (
        <Animated.View style={[styles.highlightWrap, lean ? leanStyle : null]}>
          <LinearGradient colors={[colors.bubbleHighlight, 'transparent']} style={styles.highlight} />
        </Animated.View>
      )}

      <View style={[StyleSheet.absoluteFill, styles.rim]} />
    </View>
  );
};

const styles = themedStyles(() =>
  StyleSheet.create({
    fill: {
      flex: 1,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    body: {
      backgroundColor: colors.bubbleFill,
    },
    tonal: {
      backgroundColor: colors.bubbleTonal,
    },
    highlightWrap: {
      position: 'absolute',
      top: 3,
      left: '16%',
      right: '16%',
      height: '34%',
    },
    highlight: {
      flex: 1,
      borderRadius: radius.pill,
    },
    rim: {
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.bubbleRim,
      pointerEvents: 'none',
    },
  }),
);
