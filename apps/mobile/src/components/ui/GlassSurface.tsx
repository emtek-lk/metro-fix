import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { colors } from '../../theme/colors';
import { elevation } from '../../theme/elevation';
import { themedStyles } from '../../theme/themedStyles';
import { useTheme } from '../../theme/ThemeProvider';

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius; the glass is clipped to it. */
  borderRadius?: number;
  /** Colour wash over the glass, e.g. to tint a primary control. */
  tintColor?: string;
  /** Lets iOS 26+ glass react to touch (shimmer / press). */
  interactive?: boolean;
  /** Drop shadow beneath the surface. Off for surfaces that sit flush with other glass. */
  shadow?: boolean;
}

/**
 * A floating "glass" surface for controls that sit above scrolling content (tab bar, header,
 * action bar, sheets). It picks the best available rendering:
 *
 *  - iOS 26+            native Liquid Glass
 *  - older iOS          system blur material
 *  - web                CSS backdrop blur
 *  - Android            tonal translucent surface (Android has no glass material)
 *  - Reduce Transparency  a plain opaque surface, on every platform
 *
 * Keep glass to the controls layer; content cards should stay opaque.
 */
export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  style,
  borderRadius = 24,
  tintColor,
  interactive = false,
  shadow = true,
}) => {
  const { scheme, reduceTransparency } = useTheme();
  const shape: ViewStyle = { borderRadius };
  const outer: StyleProp<ViewStyle> = [styles.outer, shadow && elevation.e3, shape, style];

  if (reduceTransparency) {
    return (
      <View style={[outer, styles.solid, shape]}>
        {children}
      </View>
    );
  }

  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <View style={outer}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={scheme}
          tintColor={tintColor}
          isInteractive={interactive}
          style={[styles.fill, shape]}
        >
          {children}
        </GlassView>
      </View>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={outer}>
        <View style={[styles.fill, styles.clip, shape]}>
          <BlurView
            intensity={55}
            tint={scheme === 'dark' ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.wash, tintColor ? { backgroundColor: tintColor } : null]} />
          <View style={[StyleSheet.absoluteFill, styles.rim, shape, styles.passThrough]} />
          <TopHighlight />
          {children}
        </View>
      </View>
    );
  }

  // Web and Android: translucent tonal surface (web also blurs what is behind it).
  const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(22px) saturate(160%)' } as ViewStyle) : null;
  return (
    <View style={[outer, styles.tonal, webBlur, shape]}>
      {tintColor ? <View style={[StyleSheet.absoluteFill, shape, { backgroundColor: tintColor }]} /> : null}
      <TopHighlight />
      {children}
    </View>
  );
};

/** A hairline that fades out toward the corners, like light catching the top rim of the glass. */
const TopHighlight: React.FC = () => (
  <LinearGradient
    colors={['transparent', colors.glassHighlight, 'transparent']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.highlight}
  />
);

const styles = themedStyles(() =>
  StyleSheet.create({
    highlight: {
      position: 'absolute',
      top: 0,
      left: 12,
      right: 12,
      height: StyleSheet.hairlineWidth * 2,
      pointerEvents: 'none',
    },
    outer: {
      backgroundColor: 'transparent',
    },
    passThrough: {
      pointerEvents: 'none',
    },
    fill: {
      overflow: 'hidden',
    },
    clip: {
      overflow: 'hidden',
    },
    wash: {
      backgroundColor: colors.glassTint,
    },
    rim: {
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.glassBorder,
    },
    solid: {
      backgroundColor: colors.glassSolid,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tonal: {
      backgroundColor: Platform.OS === 'android' ? colors.glassAndroid : colors.glassTint,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
  }),
);
