import React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/layout';
import { themedStyles } from '../../theme/themedStyles';
import { useTheme } from '../../theme/ThemeProvider';

export interface TabBubbleProps {
  /**
   * Horizontal offset (px) for the highlight. The tab bar drives it opposite to the drag direction,
   * so the highlight seems to hang back as the lens moves, which sells the depth.
   */
  lean?: Animated.Value;
}

/**
 * The glass "lens" under the active tab, built to read as a solid, curved piece of glass:
 *
 *  - body        the glass itself (native Liquid Glass on iOS 26+, a soft fill elsewhere)
 *  - shading     light from the top, the lower edge in shade
 *  - glow        warm light bounced up along the bottom edge
 *  - highlight   a bright specular streak near the top that slides as the lens moves
 *  - rim         a lit edge: bright on top, softer on the sides, warm underneath
 *  - shadow      a soft drop shadow that lifts it off the bar (iOS and web)
 *
 * It fills whatever box the tab bar gives it.
 */
export const TabBubble: React.FC<TabBubbleProps> = ({ lean }) => {
  const { scheme, reduceTransparency } = useTheme();
  const nativeGlass = Platform.OS === 'ios' && !reduceTransparency && isLiquidGlassAvailable();

  return (
    <View style={[styles.fill, styles.lift]}>
      <View style={[StyleSheet.absoluteFill, styles.clip]}>
        {nativeGlass ? (
          <GlassView
            glassEffectStyle="regular"
            colorScheme={scheme}
            tintColor={colors.bubbleTint}
            isInteractive
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.body]} />
        )}

        {/* Shading: light on top, shade below */}
        <LinearGradient
          colors={[colors.bubbleLight, 'transparent', colors.bubbleShade]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Warm bounce light along the bottom edge */}
        <LinearGradient
          colors={['transparent', colors.bubbleGlow]}
          style={styles.glow}
        />

        {/* Specular highlight near the top, sliding against the motion */}
        <Animated.View
          style={[styles.specularWrap, lean ? { transform: [{ translateX: lean }] } : null]}
        >
          <LinearGradient
            colors={[colors.bubbleSpecular, 'transparent']}
            style={styles.specular}
          />
        </Animated.View>
      </View>

      {/* Lit rim: a different colour on each side reads as light wrapping the edge */}
      <View style={[StyleSheet.absoluteFill, styles.rim]} />
    </View>
  );
};

const styles = themedStyles(() =>
  StyleSheet.create({
    fill: {
      flex: 1,
      borderRadius: radius.pill,
    },
    // The drop shadow lives on the unclipped outer layer. Android cannot draw a soft shadow under a
    // translucent view, so it relies on the shading and rim for depth.
    lift: Platform.select({
      android: {},
      default: {
        shadowColor: colors.bubbleShadow,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.32,
        shadowRadius: 9,
      },
    }) as object,
    clip: {
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    body: {
      backgroundColor: colors.bubbleFill,
    },
    glow: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '45%',
    },
    specularWrap: {
      position: 'absolute',
      top: 3,
      left: '14%',
      right: '14%',
      height: '38%',
    },
    specular: {
      flex: 1,
      borderRadius: radius.pill,
    },
    rim: {
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderTopColor: colors.bubbleRimTop,
      borderLeftColor: colors.bubbleRimSide,
      borderRightColor: colors.bubbleRimSide,
      borderBottomColor: colors.bubbleRimBottom,
      pointerEvents: 'none',
    },
  }),
);
