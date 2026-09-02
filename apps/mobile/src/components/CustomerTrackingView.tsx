import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import { realtimeSocket } from '../services/websocket';

import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { ScreenHeader } from './ui/ScreenHeader';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { getStatusPresentation } from '../theme/status';

interface CustomerTrackingViewProps {
  job: ServiceRequest;
  onNewBooking: () => void;
}

/**
 * Timeline order for the 7-stage lifecycle. Order only — the label, icon and
 * colour for each stage come from the shared status map so the timeline stays
 * consistent with every StatusPill elsewhere in the app.
 */
const LIFECYCLE_STAGES: JobStatus[] = [
  JobStatus.REQUESTED,
  JobStatus.PENDING_ACCEPTANCE,
  JobStatus.ASSIGNED,
  JobStatus.ON_ROUTE,
  JobStatus.INSPECTION,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
];

export const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({
  job: initialJob,
  onNewBooking,
}) => {
  const insets = useSafeAreaInsets();
  const [currentJob, setCurrentJob] = useState<ServiceRequest>(initialJob);

  useEffect(() => {
    // Listen to real-time WebSocket update events from NestJS backend
    const unsubscribe = realtimeSocket.on('job.updated', (updatedJob: any) => {
      if (updatedJob.id === currentJob.id) {
        console.log('[CustomerTrackingView] Real-time status update received:', updatedJob.status);
        setCurrentJob(updatedJob);
      }
    });

    return () => unsubscribe();
  }, [currentJob.id]);

  const currentStageIndex = LIFECYCLE_STAGES.findIndex(
    (s) => s === currentJob.status,
  );

  const current = getStatusPresentation(currentJob.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance(insets) }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <ScreenHeader
        eyebrow="Live service tracking"
        title={currentJob.title}
        subtitle={`Ticket #${currentJob.id.slice(-6).toUpperCase()}`}
        right={
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        }
      />

      {/* Current Stage Hero */}
      <View style={[styles.heroCard, { borderColor: current.color }]}>
        <Text style={styles.heroStatusLabel}>Current stage</Text>
        <View style={styles.heroStatusRow}>
          <View style={[styles.heroIconBox, { backgroundColor: current.color }]}>
            <Icon name={current.icon} size={20} color={colors.white} />
          </View>
          <Text style={styles.heroStatusValue}>{current.label}</Text>
        </View>
        <Text style={styles.heroDesc}>{currentJob.description}</Text>
      </View>

      {/* Lifecycle Tracker */}
      <View style={styles.trackerCard}>
        <Text style={styles.trackerTitle}>Service lifecycle progress</Text>

        <View style={styles.stageList}>
          {LIFECYCLE_STAGES.map((status, index) => {
            const stage = getStatusPresentation(status);
            const isComplete = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isDone = isComplete || isCurrent;
            const isLast = index === LIFECYCLE_STAGES.length - 1;

            return (
              <View key={status} style={styles.stageRow}>
                <View style={styles.stageIconCol}>
                  <View
                    style={[
                      styles.stageIcon,
                      isDone && { backgroundColor: stage.color, borderColor: stage.color },
                    ]}
                  >
                    <Icon
                      name={isComplete ? 'check' : stage.icon}
                      size={14}
                      color={isDone ? colors.white : colors.textMuted}
                    />
                  </View>
                  {!isLast && (
                    <View
                      style={[styles.stageConnector, isComplete && { backgroundColor: stage.color }]}
                    />
                  )}
                </View>

                <View style={styles.stageContentCol}>
                  <Text style={[styles.stageLabel, isDone && styles.stageLabelActive]}>
                    {stage.label}
                  </Text>
                  {isCurrent && <Text style={styles.activeTag}>In progress at site</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Assigned Technician Card */}
      {currentJob.workerId ? (
        <View style={styles.workerCard}>
          <Text style={styles.workerCardTitle}>Assigned service technician</Text>
          <View style={styles.workerRow}>
            <View style={styles.avatarBox}>
              <Icon name="user" size={22} color={colors.brand} />
            </View>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>Alex Rivers (Field Tech #88)</Text>
              <View style={styles.workerMetaRow}>
                <Icon name="star" size={12} color={colors.brand} />
                <Text style={styles.workerMeta}>4.9 Rating • Hard & Soft FM Certified</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.dispatchingBox}>
          <Icon name="radio" size={17} color={colors.info} />
          <Text style={styles.dispatchingText}>
            Customer Care is currently selecting the nearest certified technician for your site location.
          </Text>
        </View>
      )}

      {/* Action Footer */}
      <Button
        title="Book Another Service"
        onPress={onNewBooking}
        variant="outline"
        size="large"
        icon={<Icon name="plus" size={17} color={colors.brand} />}
        style={styles.newBookingBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
  },

  // ── Live badge ──
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.successSubtle,
    borderWidth: 1,
    borderColor: colors.success,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.success,
  },

  // ── Hero ──
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1.5,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroStatusLabel: {
    ...typography.overline,
    color: colors.textSecondary,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatusValue: {
    ...typography.h1,
    color: colors.text,
    flex: 1,
  },
  heroDesc: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },

  // ── Tracker ──
  trackerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  trackerTitle: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  stageList: {
    gap: 0,
  },
  stageRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stageIconCol: {
    alignItems: 'center',
    width: 32,
  },
  stageIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageConnector: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: colors.border,
  },
  stageContentCol: {
    flex: 1,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xs + 2,
  },
  stageLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  stageLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  activeTag: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brand,
    marginTop: spacing.xs,
  },

  // ── Technician ──
  workerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  workerCardTitle: {
    ...typography.overline,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSubtle,
    borderWidth: 1,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerInfo: {
    flex: 1,
    minWidth: 0,
  },
  workerName: {
    ...typography.h3,
    color: colors.text,
  },
  workerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  workerMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },

  // ── Dispatching ──
  dispatchingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  dispatchingText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },

  newBookingBtn: {
    marginTop: spacing.xs,
  },
});
