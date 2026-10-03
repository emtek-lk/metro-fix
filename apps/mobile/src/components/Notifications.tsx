import React, { useMemo } from 'react';
import { Animated, Pressable, View, StyleSheet } from 'react-native';
import { Text } from './ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Icon, type FeatherIconName } from './ui/Icon';
import { ScreenHeader } from './ui/ScreenHeader';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';
import { relativeTime } from '../lib/time';
import {
  groupNotifications,
  type AppNotification,
  type NotificationKind,
} from '../lib/notifications';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  /** Development helper: raises a real dispatch alert to test the accept / reject flow. */
  onSimulateAlert: () => void;
}

const KIND_ICON: Record<NotificationKind, FeatherIconName> = {
  dispatch: 'zap',
  quote: 'check-circle',
  location: 'radio',
  system: 'bell',
};

const kindTint = (kind: NotificationKind): string =>
  kind === 'dispatch'
    ? colors.brand
    : kind === 'quote'
      ? colors.success
      : kind === 'location'
        ? colors.info
        : colors.textSecondary;

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onSimulateAlert,
}) => {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingHeader();
  const groups = useMemo(() => groupNotifications(notifications), [notifications]);

  const markAll =
    unreadCount > 0 ? (
      <Pressable
        onPress={onMarkAllRead}
        style={styles.markAll}
        accessibilityRole="button"
        accessibilityLabel="Mark all alerts as read"
      >
        <Icon name="check" size={14} color={colors.brand} />
        <Text style={styles.markAllText}>Mark all read</Text>
      </Pressable>
    ) : undefined;

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarClearance(insets) }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Notifications"
          title="Dispatch Alerts"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
          right={markAll}
        />

        {__DEV__ && (
          <Card variant="bordered" borderRadius={radius.xl} padding={spacing.lg + 2} style={styles.testCard}>
            <View style={styles.testHeader}>
              <Icon name="sliders" size={15} color={colors.textSecondary} />
              <Text style={styles.testTitle}>Developer tools</Text>
            </View>
            <Text style={styles.testDesc}>
              Trigger a dispatch alert to verify the worker acceptance flow.
            </Text>
            <Button
              title="Send test alert"
              onPress={onSimulateAlert}
              variant="secondary"
              size="small"
              style={styles.testButton}
            />
          </Card>
        )}

        {groups.length === 0 ? (
          <EmptyState
            icon="bell-off"
            title="No alerts yet"
            description="Dispatch requests, quote decisions and job updates will appear here."
          />
        ) : (
          groups.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.sectionHeading}>{group.title}</Text>
              <View style={styles.list}>
                {group.data.map((n) => (
                  <Pressable
                    key={n.id}
                    onPress={() => onMarkRead(n.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${n.unread ? 'Unread. ' : ''}${n.title}. ${n.body}`}
                    accessibilityHint={n.unread ? 'Marks this alert as read' : undefined}
                  >
                    <Card
                      variant="elevated"
                      borderRadius={radius.lg}
                      padding={spacing.lg}
                      style={n.unread ? styles.unreadCard : undefined}
                    >
                      <View style={styles.notifRow}>
                        <View style={styles.notifIcon}>
                          <Icon name={KIND_ICON[n.kind]} size={17} color={kindTint(n.kind)} />
                        </View>

                        <View style={styles.notifBodyCol}>
                          <View style={styles.notifHeader}>
                            <Text style={[styles.notifTitle, !n.unread && styles.notifTitleRead]} numberOfLines={1}>
                              {n.title}
                            </Text>
                            {n.unread && <View style={styles.unreadDot} />}
                          </View>
                          <Text style={styles.notifBody}>{n.body}</Text>
                          <Text style={styles.notifTime}>{relativeTime(n.createdAt)}</Text>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </Animated.ScrollView>
      <GlassHeader title="Dispatch Alerts" scrollY={scrollY} right={markAll} />
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
  },

  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: layout.minTap,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSubtle,
  },
  markAllText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brand,
  },

  // ── Dev tools panel ──
  testCard: {
    marginBottom: spacing.xxl,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  testTitle: {
    ...typography.label,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  testDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  testButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },

  // ── List ──
  group: {
    marginBottom: spacing.xl,
  },
  sectionHeading: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
  },
  notifRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: colors.surfaceRaised,
  },
  notifBodyCol: {
    flex: 1,
    minWidth: 0,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notifTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  notifTitleRead: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    flexShrink: 0,
  },
  notifBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  notifTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
}));
