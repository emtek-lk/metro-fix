import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

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
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.variantSecondary;
      case 'outline':
        return styles.variantOutline;
      case 'danger':
        return styles.variantDanger;
      case 'primary':
      default:
        return styles.variantPrimary;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return styles.textOutline;
      case 'danger':
        return styles.textDanger;
      case 'primary':
      default:
        return styles.textPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.sizeSmall;
      case 'large':
        return styles.sizeLarge;
      case 'medium':
      default:
        return styles.sizeMedium;
    }
  };

  const getSizeTextStyle = () => {
    switch (size) {
      case 'small':
        return styles.textSizeSmall;
      case 'large':
        return styles.textSizeLarge;
      case 'medium':
      default:
        return styles.textSizeMedium;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.85}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#F97316' : '#FFFFFF'} size="small" />
      ) : (
        <>
          {icon ? icon : null}
          <Text style={[styles.baseText, getVariantTextStyle(), getSizeTextStyle(), textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 999, // Extreme pill shape matching reference
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  variantPrimary: {
    backgroundColor: '#F97316', // METRO-FIX primary brand orange
  },
  variantSecondary: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  variantDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  disabledButton: {
    opacity: 0.5,
  },
  sizeSmall: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sizeMedium: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  sizeLarge: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
  },
  baseText: {
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: '#F8FAFC',
  },
  textOutline: {
    color: '#F97316',
  },
  textDanger: {
    color: '#FCA5A5',
  },
  textSizeSmall: {
    fontSize: 13,
  },
  textSizeMedium: {
    fontSize: 15,
  },
  textSizeLarge: {
    fontSize: 16,
  },
});
