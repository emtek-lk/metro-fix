import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '@metro-fix/core-types';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Icon } from './ui/Icon';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { elevation } from '../theme/elevation';

export interface MobileLoginScreenProps {
  onLoginSuccess?: (user: User, token: string) => void;
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
      { label: 'Amina', email: 'amina@metro-fix.com', password: 'Password123!' },
      { label: 'Omar', email: 'omar@metro-fix.com', password: 'Password123!' },
      { label: 'Admin', email: 'admin@metro-fix.com', password: 'Password123!' },
    ]
  : [];

export function MobileLoginScreen({ onLoginSuccess }: MobileLoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message || 'Login failed. Please check your network connection.');
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
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>MF</Text>
            </View>
            <Text style={styles.brandTitle}>METRO-FIX</Text>
            <Text style={styles.brandSubtitle}>Field Technician & Service Portal</Text>
          </View>

          {/* Login Form Container */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in to your workspace</Text>
            <Text style={styles.cardDesc}>Enter your dispatch credentials to manage jobs</Text>

            {error ? (
              <View style={styles.errorBox}>
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
                value={email}
                onChangeText={setEmail}
              />

              <Input
                label="Password"
                icon="lock"
                placeholder="Enter your password"
                secureTextEntry
                textContentType="password"
                value={password}
                onChangeText={setPassword}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
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
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...elevation.e2,
  },
  logoBadgeText: {
    ...typography.h1,
    color: colors.white,
    letterSpacing: 1,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    ...elevation.e2,
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
    marginTop: spacing.xxl,
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
});
