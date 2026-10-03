import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { themedStyles } from '../../theme/themedStyles';
import { blendOver } from '../../lib/color';

/**
 * The app's ambient backdrop: the base surface colour with a soft warm glow from the top corner
 * and a cool counter-glow from the bottom. It gives glass controls something to refract, and
 * costs nothing when content covers it. Render it once, behind everything.
 */
export const AppBackground: React.FC = () => {
  if (Platform.OS === 'android') {
    // One opaque diagonal gradient (the glows are pre-blended into the base colour), cached as a
    // GPU texture: a single draw with no blending, instead of three overlapping full-screen layers
    // re-shaded every frame. Measured on an Android emulator this took animation frames from
    // ~100ms to ~57ms; flat colour is ~42ms, which is that emulator's floor.
    return (
      <View style={styles.root} renderToHardwareTextureAndroid>
        <LinearGradient
          colors={[
            blendOver(colors.ambientWarm, colors.bg),
            colors.bg,
            blendOver(colors.ambientCool, colors.bg),
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  return (
    <View style={styles.root} shouldRasterizeIOS>
      <LinearGradient
        colors={[colors.ambientWarm, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', colors.ambientCool]}
        start={{ x: 0.15, y: 0.45 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = themedStyles(() =>
  StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFill as object,
      backgroundColor: colors.bg,
      pointerEvents: 'none',
    },
  }),
);
