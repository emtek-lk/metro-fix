import React from 'react';
import { Animated, RefreshControl, View, StyleSheet, Switch } from 'react-native';
import { Text } from './ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from './ui/Card';
import { ScreenHeader } from './ui/ScreenHeader';
import { Button } from './ui/Button';
import { SegmentedControl } from './ui/SegmentedControl';
import { Icon, type FeatherIconName } from './ui/Icon';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { useAuth } from '../context/AuthContext';
import { useWorkerStats, useSetAvailability, useMySubscription } from '../hooks/useJobs';
import { tierLabel } from '../lib/plans';
import { usePullRefresh } from '../hooks/usePullRefresh';
import { useToast } from './ui/Toast';
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';
import { Role } from '@metro-fix/core-types';
import { themedStyles } from '../theme/themedStyles';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';

const APPEARANCE_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const NOT_AVAILABLE = '—';

const settingsRows = (pillars: string): { icon: FeatherIconName; label: string; value: string }[] => [
  { icon: 'radio', label: 'Telemetry GPS Auto-Sync', value: 'ACTIVE' },
  { icon: 'zap', label: 'Service Pillars', value: pillars },
  { icon: 'shield', label: 'Authentication Token', value: 'JWT Bearer' },
];

export interface ProfileScreenProps {
  /** Development builds only: opens the UI gallery. */
  onOpenGallery?: () => void;
  /** Customers: opens the plans page to view or change their subscription. */
  onOpenSubscription?: () => void;
  /** Opens the change-password screen. */
  onChangePassword?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenGallery, onOpenSubscription, onChangePassword }) => {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingHeader();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useTheme();
  const isWorker = user?.role === Role.WORKER;
  const isCustomer = user?.role === Role.CUSTOMER;
  const subscription = useMySubscription(isCustomer);
  // The worker's real rating, completed and active jobs (GET /workers/me/stats).
  const statsQuery = useWorkerStats(isWorker);
  const stats = statsQuery.data;
  const setAvailability = useSetAvailability();
  const { refreshing, onRefresh } = usePullRefresh(() =>
    Promise.all([isWorker ? statsQuery.refetch() : null, isCustomer ? subscription.refetch() : null]),
  );
  const toast = useToast();
  const statValue = (value: number | string | undefined) =>
    value === undefined ? NOT_AVAILABLE : String(value);
  const pillars = stats?.servicePillars?.length ? stats.servicePillars.join(' / ') : NOT_AVAILABLE;
  const roleLabel = (user?.role || 'USER').replace(/_/g, ' ');

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarClearance(insets) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />}
      >
        <ScreenHeader eyebrow="Account" title="Profile" />

        {/* Profile Card */}
        <Card variant="elevated" borderRadius={radius.xxl} padding={spacing.xxl} style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.userName}>{user?.fullName || 'METRO-FIX user'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{roleLabel} ACCOUNT</Text>
          </View>

          {isWorker && (
            <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={styles.statValueRow}>
                  <Icon name="star" size={14} color={colors.brand} />
                  <Text style={styles.statValue}>{stats ? stats.rating.toFixed(1) : NOT_AVAILABLE}</Text>
                </View>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{statValue(stats?.completedJobs)}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{statValue(stats?.activeJobs)}</Text>
                <Text style={styles.statLabel}>Active now</Text>
              </View>
            </View>

            <View style={styles.dutyRow}>
              <View style={styles.dutyText}>
                <Text style={styles.dutyTitle}>{stats?.isAvailable === false ? 'Off duty' : 'On duty'}</Text>
                <Text style={styles.dutyDesc}>
                  {stats?.isAvailable === false
                    ? 'Dispatch will not offer you new jobs.'
                    : 'Dispatch can offer you new jobs.'}
                </Text>
              </View>
              <Switch
                value={stats?.isAvailable !== false}
                disabled={!stats || setAvailability.isPending}
                onValueChange={(next) =>
                  setAvailability.mutate(next, {
                    onError: () => toast.error('Could not change your duty status. Try again.', 'Not updated'),
                  })
                }
                trackColor={{ true: colors.brand }}
                accessibilityLabel="On duty"
              />
            </View>
            </>
          )}
        </Card>

        {isWorker && (
          <>
          {/* Dispatch Settings */}
          <Text style={styles.sectionHeading}>Dispatch & system settings</Text>

          <Card variant="elevated" borderRadius={radius.lg} padding={spacing.xs}>
            {settingsRows(pillars).map((row, index) => (
              <View key={row.label}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.settingRow}>
                  <View style={styles.settingLabelGroup}>
                    <Icon name={row.icon} size={16} color={colors.textSecondary} />
                    <Text style={styles.settingLabel} numberOfLines={1}>
                      {row.label}
                    </Text>
                  </View>
                  <Text style={styles.settingValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </Card>

          </>
        )}

        {isCustomer && onOpenSubscription ? (
          <>
            <Text style={styles.sectionHeading}>Subscription</Text>
            <Card variant="elevated" borderRadius={radius.lg} padding={spacing.lg}>
              <View style={styles.planRow}>
                <View style={styles.planText}>
                  <Text style={styles.planTitle}>
                    {subscription.data?.tier ? `${tierLabel(subscription.data.tier)} plan` : 'No plan yet'}
                  </Text>
                  <Text style={styles.planDesc}>
                    {subscription.data?.tier
                      ? `Billed ${subscription.data.billingCycle === 'ANNUAL' ? 'annually' : 'monthly'}. Upgrade or downgrade any time.`
                      : 'You need a plan to raise service requests.'}
                  </Text>
                </View>
                <Button
                  title={subscription.data?.tier ? 'Manage' : 'Choose plan'}
                  onPress={onOpenSubscription}
                  variant={subscription.data?.tier ? 'secondary' : 'primary'}
                  size="small"
                />
              </View>
            </Card>
          </>
        ) : null}

        {/* Appearance */}
        {onChangePassword ? (
          <>
            <Text style={styles.sectionHeading}>Account</Text>
            <Card variant="elevated" borderRadius={radius.lg} padding={spacing.md}>
              <Button
                title="Change password"
                onPress={onChangePassword}
                variant="secondary"
                size="medium"
                icon={<Icon name="lock" size={16} color={colors.text} />}
              />
            </Card>
          </>
        ) : null}

        <Text style={styles.sectionHeading}>Appearance</Text>
        <Card variant="elevated" borderRadius={radius.lg} padding={spacing.md}>
          <SegmentedControl
            options={APPEARANCE_OPTIONS}
            value={preference}
            onChange={setPreference}
            accessibilityLabel="Theme"
          />
        </Card>

        {__DEV__ && onOpenGallery ? (
          <>
            <Text style={styles.sectionHeading}>Developer</Text>
            <Card variant="elevated" borderRadius={radius.lg} padding={spacing.md}>
              <Button
                title="Open UI gallery"
                onPress={onOpenGallery}
                variant="secondary"
                size="medium"
                icon={<Icon name="grid" size={16} color={colors.text} />}
              />
            </Card>
          </>
        ) : null}

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={logout}
          variant="danger"
          size="large"
          icon={<Icon name="log-out" size={17} color={colors.dangerText} />}
          style={styles.logoutBtn}
        />
      </Animated.ScrollView>
      <GlassHeader title="Profile" scrollY={scrollY} />
    </View>
  );
};

const styles = themedStyles(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
  },

  // ── Profile card ──
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.white,
  },
  onlineBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  userName: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  roleTag: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSubtle,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  roleTagText: {
    ...typography.overline,
    color: colors.brand,
  },

  // ── Stats ──
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  planText: { flex: 1 },
  planTitle: { ...typography.label, fontWeight: '800', color: colors.text },
  planDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  dutyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignSelf: 'stretch',
  },
  dutyText: { flex: 1 },
  dutyTitle: { ...typography.label, fontWeight: '800', color: colors.text },
  dutyDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },

  // ── Settings ──
  sectionHeading: {
    ...typography.overline,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: layout.minTap,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
  },
  settingValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brand,
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  logoutBtn: {
    marginTop: spacing.xxl,
  },
}));
