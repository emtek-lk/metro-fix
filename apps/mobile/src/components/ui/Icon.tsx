import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import type { StyleProp, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';

/**
 * Single icon entry point for the mobile app.
 *
 * Every screen imports `<Icon />` rather than the icon library directly, so the
 * underlying set can be swapped in one file without touching any screen.
 * Replaces the emoji previously used as iconography, which rendered
 * inconsistently across platforms and could not be recoloured or sized.
 */
export type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

export interface IconProps {
  name: FeatherIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 18,
  color = colors.text,
  style,
}) => <Feather name={name} size={size} color={color} style={style} />;
