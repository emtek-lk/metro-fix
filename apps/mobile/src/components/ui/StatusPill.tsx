import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { JobStatus } from '@metro-fix/core-types';
import { getStatusPresentation } from '../../theme/status';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/layout';
import { colors } from '../../theme/colors';
import { Icon } from './Icon';

export interface StatusPillProps {
  status: JobStatus | string;
  size?: 'small' | 'medium';
  /** Solid fill (default) or a tinted outline treatment. */
  tone?: 'solid' | 'subtle';
  style?: StyleProp<ViewStyle>;
}

/**
 * Lifecycle stage badge. Colour, icon and label all come from the single
 * presentation map in `theme/status`, replacing three duplicated colour
 * switches across WorkerDashboard, JobDetail and JobHistory.
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'medium',
  tone = 'solid',
  style,
}) => {
  const { label, color, icon } = getStatusPresentation(status);
  const isSmall = size === 'small';
  const iconSize = isSmall ? 11 : 13;
  const foreground = tone === 'solid' ? colors.white : color;

  return (
    <View
      style={[
        styles.pill,
        isSmall ? styles.pillSmall : styles.pillMedium,
        tone === 'solid'
          ? { backgroundColor: color }
          : { backgroundColor: 'transparent', borderWidth: 1, borderColor: color },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={foreground} />
      <Text
        style={[styles.label, isSmall && styles.labelSmall, { color: foreground }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  pillMedium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  pillSmall: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 14,
  },
});
