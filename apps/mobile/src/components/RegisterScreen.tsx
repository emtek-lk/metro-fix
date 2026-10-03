import React, { useRef, useState } from 'react';
import { StyleSheet, View, Image, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { Text } from './ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { GlassSurface } from './ui/GlassSurface';
import { useToast } from './ui/Toast';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { elevation } from '../theme/elevation';
import { themedStyles } from '../theme/themedStyles';
import {
  validateRegistration,
  type RegistrationErrors,
  type RegistrationValues,
} from '../lib/validation';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require('../../assets/logo-tile.png');

export interface RegisterScreenProps {
  onBack: () => void;
  /**
   * Creates the account. Self-registration is not connected to the backend yet, so when this is
   * omitted the form validates and then explains that sign-up is not available.
   */
  onSubmit?: (values: RegistrationValues) => Promise<void>;
}

const EMPTY: RegistrationValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

/** Customer self-registration form. */
export function RegisterScreen({ onBack, onSubmit }: RegisterScreenProps) {
  const toast = useToast();
  const [values, setValues] = useState<RegistrationValues>(EMPTY);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const set = (key: keyof RegistrationValues) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    // Clear a field's error as soon as the customer starts fixing it.
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async () => {
    const found = validateRegistration(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Please check the highlighted fields.', 'Almost there');
      return;
    }
    if (!onSubmit) {
      toast.info('Customer sign-up is not available in the app yet.', 'Coming soon');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error: any) {
      toast.error(error?.message || 'Could not create your account.', 'Sign-up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <IconButton
              onPress={onBack}
              accessibilityLabel="Back to sign in"
              icon={<Icon name="chevron-left" size={22} color={colors.text} />}
              backgroundColor={colors.surface}
              size={44}
            />
          </View>

          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image source={LOGO} style={styles.logo} accessibilityLabel="METRO-FIX logo" />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              Create your account
            </Text>
            <Text style={styles.subtitle}>Request and track facility maintenance in minutes</Text>
          </View>

          <GlassSurface borderRadius={radius.xxl} style={styles.glassCard}>
            <View style={styles.card}>
              <View style={styles.fields}>
                <Input
                  label="Full name"
                  icon="user"
                  placeholder="Eleanor Vance"
                  autoCapitalize="words"
                  textContentType="name"
                  autoComplete="name"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  value={values.fullName}
                  onChangeText={set('fullName')}
                  error={errors.fullName}
                />
                <Input
                  label="Email address"
                  icon="mail"
                  placeholder="you@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  inputRef={emailRef}
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  value={values.email}
                  onChangeText={set('email')}
                  error={errors.email}
                />
                <Input
                  label="Phone number"
                  icon="phone"
                  placeholder="+94 77 123 4567"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  inputRef={phoneRef}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  value={values.phone}
                  onChangeText={set('phone')}
                  error={errors.phone}
                  helperText="Technicians use this to reach you on the day."
                />
                <Input
                  label="Password"
                  icon="lock"
                  placeholder="At least 8 characters"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  inputRef={passwordRef}
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  value={values.password}
                  onChangeText={set('password')}
                  error={errors.password}
                  trailing={
                    <IconButton
                      onPress={() => setShowPassword((shown) => !shown)}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      icon={
                        <Icon
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={18}
                          color={colors.textSecondary}
                        />
                      }
                      backgroundColor="transparent"
                      size={44}
                    />
                  }
                />
                <Input
                  label="Confirm password"
                  icon="lock"
                  placeholder="Re-enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                  returnKeyType="go"
                  inputRef={confirmRef}
                  onSubmitEditing={handleSubmit}
                  value={values.confirmPassword}
                  onChangeText={set('confirmPassword')}
                  error={errors.confirmPassword}
                />
              </View>

              <Button
                title="Create account"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                variant="primary"
                size="large"
                style={styles.submit}
              />
            </View>
          </GlassSurface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.lg,
    },
    topRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    logoWrap: {
      width: 72,
      height: 72,
      borderRadius: 18,
      marginBottom: spacing.md,
      ...elevation.e2,
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    title: {
      ...typography.h1,
      color: colors.text,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    glassCard: {
      width: '100%',
    },
    card: {
      padding: spacing.xxl,
    },
    fields: {
      gap: spacing.lg,
    },
    submit: {
      marginTop: spacing.xxl,
    },
  }),
);
