import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  type TextInputProps,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/layout';
import { Icon, type FeatherIconName } from './Icon';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Validation / helper message rendered beneath the field. */
  error?: string;
  helperText?: string;
  icon?: FeatherIconName;
  multiline?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Tokenised text field, extracted from the `SoftInput` pattern that was
 * previously defined inline inside JobDetail. Presentation only — value and
 * change handling remain entirely the caller's responsibility.
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  multiline,
  containerStyle,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.brand
      : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          multiline ? styles.fieldMultiline : styles.fieldSingle,
          { borderColor },
        ]}
      >
        {icon && !multiline ? (
          <Icon
            name={icon}
            size={16}
            color={focused ? colors.brand : colors.textMuted}
          />
        ) : null}

        <TextInput
          {...inputProps}
          multiline={multiline}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, multiline && styles.inputMultiline]}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
      </View>

      {error ? (
        <View style={styles.messageRow}>
          <Icon name="alert-circle" size={12} color={colors.dangerText} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
  },
  fieldSingle: {
    borderRadius: radius.pill,
    minHeight: layout.minTap + 4,
  },
  fieldMultiline: {
    borderRadius: radius.lg,
    minHeight: 96,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.dangerText,
    flex: 1,
  },
  helperText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
