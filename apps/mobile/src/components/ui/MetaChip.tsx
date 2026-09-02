import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/layout';
import { Icon, type FeatherIconName } from './Icon';

export interface MetaChipProps {
  icon: FeatherIconName;
  label: string;
  /** Accent colour for the icon; text stays secondary for hierarchy. */
  tint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Compact icon + label chip used for service pillar, facility type, GPS state
 * and dates. Replaces inline emoji-prefixed Text nodes.
 */
export const MetaChip: React.FC<MetaChipProps> = ({
  icon,
  label,
  tint = colors.textSecondary,
  style,
}) => (
  <View style={[styles.chip, style]}>
    <Icon name={icon} size={12} color={tint} />
    <Text style={styles.label} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
