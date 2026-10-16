import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/layout';
import { themedStyles } from '../../theme/themedStyles';
import { Icon, type FeatherIconName } from './Icon';
import { PressableScale } from './PressableScale';

export interface QuickActionProps {
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
  /** Looks inactive (e.g. no phone number yet) but still responds, so the caller can explain why. */
  dimmed?: boolean;
  accessibilityHint?: string;
}

/** A compact icon-over-label button, sized to sit three across in a row. */
export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  onPress,
  dimmed = false,
  accessibilityHint,
}) => (
  <PressableScale
    onPress={onPress}
    style={({ pressed }) => [styles.action, pressed && styles.pressed, dimmed && styles.dimmed]}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={accessibilityHint}
    accessibilityState={{ disabled: dimmed }}
  >
    <View style={styles.disc}>
      <Icon name={icon} size={18} color={dimmed ? colors.textMuted : colors.brand} />
    </View>
    <Text style={[styles.label, dimmed && styles.labelDimmed]} numberOfLines={1}>
      {label}
    </Text>
  </PressableScale>
);

const styles = themedStyles(() =>
  StyleSheet.create({
    action: {
      flex: 1,
      minHeight: layout.minTap + 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      backgroundColor: colors.surfaceRaised,
    },
    dimmed: {
      opacity: 0.7,
    },
    disc: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.brandSubtle,
    },
    label: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.text,
    },
    labelDimmed: {
      color: colors.textMuted,
    },
  }),
);
