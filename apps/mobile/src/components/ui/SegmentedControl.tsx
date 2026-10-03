import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/layout';
import { themedStyles } from '../../theme/themedStyles';
import { haptics } from '../../lib/haptics';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** Compact pill-shaped single-choice control (e.g. System / Light / Dark). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !selected && styles.segmentPressed,
            ]}
            onPress={() => {
              if (!selected) haptics.select();
              onChange(option.id);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={option.label}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      gap: spacing.xs,
      padding: spacing.xs,
      backgroundColor: colors.bg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segment: {
      flex: 1,
      minHeight: layout.minTap - 4,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
    },
    segmentSelected: {
      backgroundColor: colors.brand,
    },
    segmentPressed: {
      backgroundColor: colors.surfaceRaised,
    },
    label: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    labelSelected: {
      color: colors.white,
    },
  }),
);
