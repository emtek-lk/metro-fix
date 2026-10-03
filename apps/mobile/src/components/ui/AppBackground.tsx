import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { themedStyles } from '../../theme/themedStyles';

/**
 * The app's ambient backdrop: the base surface colour with a soft warm glow from the top corner
 * and a cool counter-glow from the bottom. It gives glass controls something to refract, and
 * costs nothing when content covers it. Render it once, behind everything.
 */
export const AppBackground: React.FC = () => (
  <View style={styles.root}>
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

const styles = themedStyles(() =>
  StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFill as object,
      backgroundColor: colors.bg,
      pointerEvents: 'none',
    },
  }),
);
