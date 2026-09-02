import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/layout';

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = 'large',
  style,
}) => (
  <View style={[styles.container, style]}>
    <ActivityIndicator size={size} color={colors.brand} />
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
