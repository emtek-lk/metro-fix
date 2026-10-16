import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../components/ui/AppBackground';
import { colors } from '../theme/colors';
import { themedStyles } from '../theme/themedStyles';

interface ScreenShellProps {
  children: React.ReactNode;
  /**
   * Wrap the content in a top / side safe area. Screens that manage their own safe area (the
   * auth screens) pass false.
   */
  safeArea?: boolean;
}

/**
 * The frame every navigated screen sits in: the ambient background plus the safe area. Native
 * stack screens are stacked on top of each other, so each must paint its own opaque background;
 * a transparent screen would show the one beneath it.
 */
export const ScreenShell: React.FC<ScreenShellProps> = ({ children, safeArea = true }) => (
  <View style={styles.root}>
    <AppBackground />
    {safeArea ? (
      <SafeAreaView style={styles.fill} edges={['top', 'left', 'right']}>
        {children}
      </SafeAreaView>
    ) : (
      <View style={styles.fill}>{children}</View>
    )}
  </View>
);

const styles = themedStyles(() =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    fill: {
      flex: 1,
      backgroundColor: 'transparent',
    },
  }),
);
