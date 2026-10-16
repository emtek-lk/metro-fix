import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './ui/AppText';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { useToast } from './ui/Toast';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';

export interface ChangePasswordScreenProps {
  /**
   * First sign-in with a one-time password issued by an admin: nothing else works until a new one
   * is chosen, so there is no way back, only sign out.
   */
  forced?: boolean;
  /** Back arrow (voluntary change from Profile). */
  onBack?: () => void;
  onDone?: () => void;
}

export function ChangePasswordScreen({ forced = false, onBack, onDone }: ChangePasswordScreenProps) {
  const { logout, completePasswordChange } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const submit = async () => {
    if (!current || !next || !confirm) return setError('Fill in all three fields.');
    if (next !== confirm) return setError('The new passwords do not match.');
    if (next === current) return setError('Choose a password different from the current one.');
    setBusy(true);
    setError(null);
    try {
      await apiClient.post('/auth/change-password', { currentPassword: current, newPassword: next });
      await completePasswordChange();
      toast.success('Your password was changed.', 'Done');
      onDone?.();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not change the password.'));
    } finally {
      setBusy(false);
    }
  };

  const trailing = (
    <Pressable onPress={() => setShow((v) => !v)} accessibilityRole="button" accessibilityLabel={show ? 'Hide passwords' : 'Show passwords'} hitSlop={8}>
      <Icon name={show ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!forced && onBack ? (
            <View style={styles.topRow}>
              <IconButton
                onPress={onBack}
                accessibilityLabel="Back"
                icon={<Icon name="chevron-left" size={22} color={colors.text} />}
                backgroundColor={colors.surface}
                size={44}
              />
            </View>
          ) : null}

          <Text style={styles.title}>{forced ? 'Choose your password' : 'Change password'}</Text>
          <Text style={styles.subtitle}>
            {forced
              ? 'You signed in with a one-time password from your administrator. Pick a password only you know to continue.'
              : 'Enter your current password, then choose a new one.'}
          </Text>

          <Input
            label={forced ? 'One-time password' : 'Current password'}
            value={current}
            onChangeText={setCurrent}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            returnKeyType="next"
            onSubmitEditing={() => nextRef.current?.focus()}
            icon="lock"
            trailing={trailing}
            containerStyle={styles.field}
          />
          <Input
            label="New password"
            value={next}
            onChangeText={setNext}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            returnKeyType="next"
            inputRef={nextRef}
            onSubmitEditing={() => confirmRef.current?.focus()}
            icon="key"
            helperText="At least 8 characters, with letters and numbers."
            containerStyle={styles.field}
          />
          <Input
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            returnKeyType="done"
            inputRef={confirmRef}
            onSubmitEditing={submit}
            icon="key"
            containerStyle={styles.field}
          />

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Button title="Save new password" onPress={submit} isLoading={busy} size="large" style={styles.submit} />
          {forced ? (
            <Button title="Sign out" onPress={logout} variant="outline" size="large" style={styles.signOut} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    content: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.xs },
    topRow: { marginBottom: spacing.md },
    title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
    field: { marginBottom: spacing.md },
    error: { ...typography.body, color: colors.danger, marginBottom: spacing.md },
    submit: { marginTop: spacing.sm },
    signOut: { marginTop: spacing.sm },
  }),
);
