import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
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
import { useTheme, type ThemePreference } from '../theme/ThemeProvider';
import { Role } from '@metro-fix/core-types';
import { themedStyles } from '../theme/themedStyles';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';

const APPEARANCE_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

/**
 * Worker stats and service pillars are not exposed by the API yet. Release builds show a dash
 * rather than invented numbers; development builds show sample values so the layout can be reviewed.
 * TODO(backend): replace with the worker's real rating, completed jobs, on-time rate and pillars.
 */
const NOT_AVAILABLE = '—';
const WORKER_STATS = __DEV__
  ? { rating: '4.9', completed: '142', onTime: '99%', pillars: 'HARD / SOFT' }
  : { rating: NOT_AVAILABLE, completed: NOT_AVAILABLE, onTime: NOT_AVAILABLE, pillars: NOT_AVAILABLE };

const SETTINGS_ROWS: { icon: FeatherIconName; label: string; value: string }[] = [
  { icon: 'radio', label: 'Telemetry GPS Auto-Sync', value: 'ACTIVE' },
  { icon: 'zap', label: 'Service Pillars', value: WORKER_STATS.pillars },
  { icon: 'shield', label: 'Authentication Token', value: 'JWT Bearer' },
];

export interface ProfileScreenProps {
  /** Development builds only: opens the UI gallery. */
  onOpenGallery?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenGallery }) => {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingHeader();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useTheme();
  const isWorker = user?.role === Role.WORKER;
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
        bounces={false}
        showsVerticalScrollIndicator={false}
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
                  <Text style={styles.statValue}>{WORKER_STATS.rating}</Text>
                </View>
                <Text style={styles.statLabel}>Internal Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{WORKER_STATS.completed}</Text>
                <Text style={styles.statLabel}>Completed Jobs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{WORKER_STATS.onTime}</Text>
                <Text style={styles.statLabel}>On-Time Rate</Text>
              </View>
            </View>
            </>
          )}
        </Card>

        {isWorker && (
          <>
          {/* Dispatch Settings */}
          <Text style={styles.sectionHeading}>Dispatch & system settings</Text>

          <Card variant="elevated" borderRadius={radius.lg} padding={spacing.xs}>
            {SETTINGS_ROWS.map((row, index) => (
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

        {/* Appearance */}
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
