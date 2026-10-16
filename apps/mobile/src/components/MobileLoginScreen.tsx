import React, { useRef, useState } from 'react';
import { StyleSheet, View, Image, Pressable, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { Text } from './ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '@metro-fix/core-types';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { GlassSurface } from './ui/GlassSurface';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { elevation } from '../theme/elevation';
import { themedStyles } from '../theme/themedStyles';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require('../../assets/logo-tile.png');

export interface MobileLoginScreenProps {
  onLoginSuccess?: (user: User, token: string) => void;
  /** Opens customer self-registration. The link is hidden when this is not provided. */
  onRegister?: () => void;
}

/**
 * Development-only convenience accounts.
 *
 * Guarded by `__DEV__` at the point of definition, not just at the point of
 * use: the bundler replaces `__DEV__` with `false` in release builds, so the
 * literals below are dead code and never reach a shipped bundle.
 */
const DEV_ACCOUNTS: { label: string; email: string; password: string }[] = __DEV__
  ? [
      { label: 'Worker 1', email: 'worker1@demo.local', password: 'Demo123!' },
      { label: 'Worker 2', email: 'worker2@demo.local', password: 'Demo123!' },
      { label: 'Customer', email: 'eleanor@skylinetowers.com', password: 'Demo123!' },
    ]
  : [];

export function MobileLoginScreen({ onLoginSuccess, onRegister }: MobileLoginScreenProps) {
  const { login } = useAuth();
  // Fields start empty in every build; dev builds get the quick sign-in chips below instead.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async (overrideEmail?: string, overridePassword?: string) => {
    const targetEmail = overrideEmail || email;
    const targetPassword = overridePassword || password;

    if (!targetEmail.trim() || !targetPassword) {
      setError('Please enter both email address and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authenticatedUser = await login(targetEmail.trim(), targetPassword);
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(authenticatedUser, '');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(getErrorMessage(err, 'Login failed. Please check your connection and try again.'));
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
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image source={LOGO} style={styles.logo} accessibilityLabel="METRO-FIX logo" />
            </View>
            <Text style={styles.brandTitle} accessibilityRole="header">
              METRO-FIX
            </Text>
            <Text style={styles.brandSubtitle}>Managed facility maintenance, on demand</Text>
          </View>

          {/* Login form */}
          <GlassSurface borderRadius={radius.xxl} style={styles.glassCard}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardDesc}>Sign in to continue</Text>

              {error ? (
                <View
                  style={styles.errorBox}
                  accessibilityLiveRegion="polite"
                  accessibilityRole="alert"
                >
                  <Icon name="alert-circle" size={16} color={colors.dangerText} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.fields}>
                <Input
                  label="Email Address"
                  icon="mail"
                  placeholder="you@metro-fix.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  value={email}
                  onChangeText={setEmail}
                />

                <Input
                  label="Password"
                  icon="lock"
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={() => handleLogin()}
                  inputRef={passwordRef}
                  value={password}
                  onChangeText={setPassword}
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
              </View>

              {/* Submit Button */}
              <Button
                title="Sign In"
                onPress={() => handleLogin()}
                isLoading={isLoading}
                variant="primary"
                size="large"
                style={styles.submitButton}
              />

              {onRegister ? (
                <Pressable
                  onPress={onRegister}
                  style={styles.registerLink}
                  accessibilityRole="button"
                  accessibilityLabel="Create a customer account"
                >
                  <Text style={styles.registerText}>
                    New customer? <Text style={styles.registerAction}>Create an account</Text>
                  </Text>
                </Pressable>
              ) : null}

              {/* Quick Preset Buttons for Testing — development builds only */}
              {__DEV__ && (
                <View style={styles.presetContainer}>
                  <Text style={styles.presetHeading}>Quick dev sign-in</Text>
                  <View style={styles.presetRow}>
                    {DEV_ACCOUNTS.map((account) => (
                      <Pressable
                        key={account.email}
                        style={({ pressed }) => [
                          styles.presetChip,
                          pressed && styles.presetChipPressed,
                        ]}
                        onPress={() => {
                          setEmail(account.email);
                          setPassword(account.password);
                          handleLogin(account.email, account.password);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Sign in as ${account.label}`}
                      >
                        <Text style={styles.presetChipText}>{account.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </GlassSurface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xxxl,
  },

  // ── Brand ──
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  // The shadow sits on a rounded wrapper so it follows the tile's corners, not the image's square box.
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 24,
    marginBottom: spacing.lg,
    ...elevation.e3,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    ...typography.display,
    color: colors.text,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // ── Form card ──
  glassCard: {
    width: '100%',
  },
  card: {
    padding: spacing.xxl,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.text,
  },
  cardDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  fields: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  submitButton: {
    marginTop: spacing.xxl,
  },
  registerLink: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minTap,
    marginTop: spacing.md,
  },
  registerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  registerAction: {
    fontWeight: '700',
    color: colors.brand,
  },

  // ── Error ──
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSubtle,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    ...typography.caption,
    color: colors.dangerText,
    flex: 1,
  },

  // ── Dev presets ──
  presetContainer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  presetHeading: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipPressed: {
    backgroundColor: colors.border,
  },
  presetChipText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
}));
