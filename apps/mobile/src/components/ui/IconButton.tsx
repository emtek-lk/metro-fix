import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Text } from './AppText';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/layout';
import { elevation } from '../../theme/elevation';
import { themedStyles } from '../../theme/themedStyles';
import { PressableScale } from './PressableScale';

export interface IconButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
  symbol?: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** Required: an icon-only control has no visible text for screen readers to announce. */
  accessibilityLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  symbol,
  size = layout.minTap,
  backgroundColor = colors.surface,
  color = colors.text,
  style,
  disabled = false,
  accessibilityLabel,
}) => {
  // Never render below the minimum accessible tap target, even if a smaller
  // visual size is requested.
  const box = Math.max(size, layout.minTap);

  return (
    <PressableScale
      style={({ pressed }) => [
        styles.circle,
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          backgroundColor,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      {icon ? (
        icon
      ) : symbol ? (
        <Text style={[styles.symbolText, { color, fontSize: box * 0.42 }]}>{symbol}</Text>
      ) : null}
    </PressableScale>
  );
};

const styles = themedStyles(() => StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.e1,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
  symbolText: {
    fontWeight: '700',
    textAlign: 'center',
  },
}));
