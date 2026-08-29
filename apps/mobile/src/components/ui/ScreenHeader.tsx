import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/layout';

export interface ScreenHeaderProps {
  title: string;
  /** Small uppercase eyebrow rendered above the title. */
  eyebrow?: string;
  subtitle?: string;
  /** Optional trailing element, e.g. an IconButton. */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Consistent screen header, replacing six bespoke header blocks that each had
 * their own spacing, sizing and casing.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  eyebrow,
  subtitle,
  right,
  style,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.textCol}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {right ? <View style={styles.rightSlot}>{right}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.brand,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rightSlot: {
    flexShrink: 0,
  },
});
