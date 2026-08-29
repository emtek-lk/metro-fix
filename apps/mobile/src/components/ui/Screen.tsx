import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { layout, tabBarClearance } from '../../theme/layout';

export interface ScreenProps {
  children: React.ReactNode;
  /** Apply the standard horizontal screen padding. */
  padded?: boolean;
  /** Reserve bottom space so content clears the floating tab bar. */
  withTabBar?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Safe-area-aware page wrapper.
 *
 * Centralises the two things every screen previously got wrong or hardcoded:
 * device insets, and the bottom clearance for the floating tab bar (which was
 * variously 100 / 110 / 80 / 40 and ignored the home indicator).
 */
export const Screen: React.FC<ScreenProps> = ({
  children,
  padded = true,
  withTabBar = false,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        padded && { paddingHorizontal: layout.screenPadding },
        withTabBar && { paddingBottom: tabBarClearance(insets) },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
