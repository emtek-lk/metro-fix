import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

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
  borderRadius = 28,
  padding = 20,
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
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  elevatedCard: {
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  borderedCard: {
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
});
