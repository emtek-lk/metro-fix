import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Text } from 'react-native';

export interface IconButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
  symbol?: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  symbol,
  size = 44,
  backgroundColor = '#FFFFFF',
  color = '#0F172A',
  style,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon ? (
        icon
      ) : symbol ? (
        <Text style={[styles.symbolText, { color, fontSize: size * 0.45 }]}>{symbol}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  disabled: {
    opacity: 0.5,
  },
  symbolText: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
