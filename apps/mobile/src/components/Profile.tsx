import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon, type FeatherIconName } from './ui/Icon';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { useAuth } from '../context/AuthContext';

const SETTINGS_ROWS: { icon: FeatherIconName; label: string; value: string }[] = [
  { icon: 'radio', label: 'Telemetry GPS Auto-Sync', value: 'ACTIVE' },
  { icon: 'zap', label: 'Service Pillars', value: 'HARD / SOFT' },
  { icon: 'shield', label: 'Authentication Token', value: 'JWT Bearer' },
];

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarClearance(insets) },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card variant="elevated" borderRadius={radius.xxl} padding={spacing.xxl} style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0).toUpperCase() || 'W'}
              </Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.userName}>{user?.fullName || 'Field Technician'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'worker@metro-fix.com'}</Text>

          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{user?.role || 'WORKER'} ACCOUNT</Text>
          </View>

          {/* Rating & Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statValueRow}>
                <Icon name="star" size={14} color={colors.brand} />
                <Text style={styles.statValue}>4.9</Text>
              </View>
              <Text style={styles.statLabel}>Internal Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>142</Text>
              <Text style={styles.statLabel}>Completed Jobs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>99%</Text>
              <Text style={styles.statLabel}>On-Time Rate</Text>
            </View>
          </View>
        </Card>

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

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={logout}
          variant="danger"
          size="large"
          icon={<Icon name="log-out" size={17} color={colors.dangerText} />}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
});
