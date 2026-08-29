import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/layout';
import { elevation } from '../../theme/elevation';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'flat' | 'elevated' | 'bordered';
  borderRadius?: number;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  borderRadius = radius.xl,
  padding = spacing.xl,
}) => {
  return (
    <View
      style={[
        styles.baseCard,
        { borderRadius, padding },
        variant === 'elevated' && styles.elevatedCard,
        variant === 'bordered' && styles.borderedCard,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  elevatedCard: {
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.e2,
  },
  borderedCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    ...elevation.e0,
  },
});
