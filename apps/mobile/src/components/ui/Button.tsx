import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Text } from './AppText';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/layout';
import { elevation } from '../../theme/elevation';
import { themedStyles } from '../../theme/themedStyles';
import { haptics } from '../../lib/haptics';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.baseButton,
        variantStyles[variant],
        sizeStyles[size],
        pressed && !isDisabled && pressedStyles[variant],
        isDisabled && styles.disabledButton,
        style,
      ]}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      accessibilityLabel={title}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' ? colors.brand : colors.white}
          size="small"
        />
      ) : (
        <>
          {icon ? icon : null}
          <Text
            style={[styles.baseText, variantTextStyles[variant], sizeTextStyles[size], textStyle]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = themedStyles(() => StyleSheet.create({
  baseButton: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: layout.minTap,
    ...elevation.e1,
  },
  disabledButton: {
    opacity: 0.45,
    ...elevation.e0,
  },
  baseText: {
    ...typography.bodyStrong,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
}));

const variantStyles = themedStyles(() => StyleSheet.create({
  primary: {
    backgroundColor: colors.brand,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.brand,
    ...elevation.e0,
  },
  danger: {
    backgroundColor: colors.dangerSubtle,
    borderWidth: 1,
    borderColor: colors.danger,
    ...elevation.e0,
  },
}));

const pressedStyles = themedStyles(() => StyleSheet.create({
  primary: { backgroundColor: colors.brandPressed },
  secondary: { backgroundColor: colors.surfaceRaised },
  outline: { backgroundColor: colors.brandSubtle },
  danger: { backgroundColor: colors.dangerPressed },
}));

const variantTextStyles = themedStyles(() => StyleSheet.create({
  primary: { color: colors.white },
  secondary: { color: colors.text },
  outline: { color: colors.brand },
  danger: { color: colors.dangerText },
}));

const sizeStyles = themedStyles(() => StyleSheet.create({
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    width: '100%',
  },
}));

const sizeTextStyles = themedStyles(() => StyleSheet.create({
  small: { fontSize: 13 },
  medium: { fontSize: 15 },
  large: { fontSize: 16 },
}));
