import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon, type FeatherIconName } from './ui/Icon';
import { ScreenHeader } from './ui/ScreenHeader';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';

interface NotificationsScreenProps {
  onSimulateAlert: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onSimulateAlert }) => {
  const insets = useSafeAreaInsets();

  const sampleNotifications: {
    id: string;
    title: string;
    body: string;
    time: string;
    unread: boolean;
    icon: FeatherIconName;
    tint: string;
  }[] = [
    {
      id: 'notif_1',
      title: 'Priority Dispatch Alert',
      body: 'New Commercial HVAC ticket available 2.4 km away.',
      time: '10 mins ago',
      unread: true,
      icon: 'zap',
      tint: colors.brand,
    },
    {
      id: 'notif_2',
      title: 'Quote Approved by Customer',
      body: 'Elevator Shaft Safety Inspection quote accepted. Work in progress.',
      time: '2 hours ago',
      unread: false,
      icon: 'check-circle',
      tint: colors.success,
    },
    {
      id: 'notif:3',
      title: 'Location Sharing Active',
      body: 'Background location tracking enabled for assigned dispatch route.',
      time: 'Yesterday',
      unread: false,
      icon: 'radio',
      tint: colors.info,
    },
  ];

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
        <ScreenHeader
          eyebrow="Notifications"
          title="Dispatch Alerts"
          subtitle="Updates on your assigned work"
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

        <Text style={styles.sectionHeading}>Recent</Text>

        <View style={styles.list}>
          {sampleNotifications.map((n) => (
            <Card key={n.id} variant="elevated" borderRadius={radius.lg} padding={spacing.lg}>
              <View style={styles.notifRow}>
                <View style={[styles.notifIcon, { backgroundColor: colors.surfaceRaised }]}>
                  <Icon name={n.icon} size={17} color={n.tint} />
                </View>

                <View style={styles.notifBodyCol}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    {n.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifBody}>{n.body}</Text>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
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
  sectionHeading: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
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
});
