import React from 'react';
import { Alert, Linking, View, StyleSheet, Animated } from 'react-native';
import { Text } from './ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  JobStatus,
  ServiceRequest,
  JOB_STAGES,
  canTransition,
  isTerminalStatus,
} from '@metro-fix/core-types';

import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { ScreenHeader } from './ui/ScreenHeader';
import { useToast } from './ui/Toast';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { getStatusPresentation } from '../theme/status';
import { themedStyles } from '../theme/themedStyles';
import { shortRef } from '../lib/ticket';
import { haptics } from '../lib/haptics';
import { getErrorMessage } from '../lib/errors';
import { trackingMessage } from '../lib/trackingCopy';
import { workerNameOf } from '../lib/jobs';
import { useCancelJob, useJobDetail } from '../hooks/useJobs';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';

interface CustomerTrackingViewProps {
  job: ServiceRequest;
  onNewBooking: () => void;
  /** When provided, a back button is shown (e.g. when opened from the requests list). */
  onBack?: () => void;
}

export const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({
  job: initialJob,
  onNewBooking,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { scrollY, onScroll } = useCollapsingHeader();
  // Live: the realtime socket writes every change into this query (see useRealtimeSync), so the
  // screen follows the job without any polling of its own. The job passed in is the first paint.
  const { data } = useJobDetail(initialJob.id);
  const currentJob = data ?? initialJob;
  const cancel = useCancelJob();

  const cancelled = currentJob.status === JobStatus.CANCELLED;
  const currentStageIndex = JOB_STAGES.indexOf(currentJob.status);
  const current = getStatusPresentation(currentJob.status);
  const technician = workerNameOf(currentJob);
  const technicianPhone = currentJob.worker?.user?.phoneNumber?.trim() || null;
  const message = trackingMessage(currentJob.status, technician);
  const canCancel = canTransition(currentJob.status, JobStatus.CANCELLED);
  const isLive = !isTerminalStatus(currentJob.status);
  const hasTechnician =
    !!currentJob.workerId &&
    currentJob.status !== JobStatus.REQUESTED &&
    currentJob.status !== JobStatus.PENDING_ACCEPTANCE &&
    !cancelled;
  const technicianCanBeCalled = hasTechnician && !!technicianPhone && !isTerminalStatus(currentJob.status);

  const confirmCancel = () => {
    Alert.alert(
      'Cancel this request?',
      currentJob.status === JobStatus.REQUESTED
        ? 'Nobody has been sent yet.'
        : 'Anyone who has been contacted will be told.',
      [
        { text: 'Keep request', style: 'cancel' },
        {
          text: 'Cancel request',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel.mutateAsync({ jobId: currentJob.id });
              haptics.success();
              toast.success('Your request was cancelled.', 'Cancelled');
            } catch (error) {
              haptics.error();
              toast.error(getErrorMessage(error, 'Could not cancel the request.'), 'Cancel failed');
            }
          },
        },
      ],
    );
  };

  const callTechnician = () => {
    if (!technicianPhone) return;
    Linking.openURL(`tel:${technicianPhone}`).catch(() =>
      toast.error('Could not open the phone app.', 'Unable to call'),
    );
  };

  const quote =
    currentJob.quoteAmount != null
      ? `LKR ${Number(currentJob.quoteAmount).toLocaleString('en-LK')}${
          currentJob.estimatedHours != null ? ` · about ${currentJob.estimatedHours}h` : ''
        }`
      : null;

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollFill}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance(insets) }]}
        showsVerticalScrollIndicator={false}
      >
        {onBack ? (
          <View style={styles.backRow}>
            <IconButton
              onPress={onBack}
              accessibilityLabel="Back to my requests"
              icon={<Icon name="chevron-left" size={22} color={colors.text} />}
              backgroundColor={colors.surface}
              size={44}
            />
          </View>
        ) : null}

        {/* Header */}
        <ScreenHeader
          eyebrow="Service tracking"
          title={currentJob.title}
          subtitle={`Ticket #${shortRef(currentJob.id)}`}
          right={
            isLive ? (
              <View style={styles.liveBadge} accessibilityLabel="Updating live">
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
            ) : undefined
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
          <Text style={styles.heroDesc}>{message.detail}</Text>
          {cancelled && currentJob.cancelReason ? (
            <Text style={styles.heroReason}>Reason: {currentJob.cancelReason}</Text>
          ) : null}
        </View>

        {/* Lifecycle Tracker (a cancelled request left the normal path, so it has no timeline) */}
        {!cancelled && (
          <View style={styles.trackerCard}>
            <Text style={styles.trackerTitle}>Service progress</Text>

            <View style={styles.stageList}>
              {JOB_STAGES.map((status, index) => {
                const stage = getStatusPresentation(status);
                const isComplete = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isDone = isComplete || isCurrent;
                const isLast = index === JOB_STAGES.length - 1;

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
                      {isCurrent && <Text style={styles.activeTag}>{message.caption}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Technician: only once one has actually accepted the job */}
        {hasTechnician ? (
          <View style={styles.workerCard}>
            <Text style={styles.workerCardTitle}>Your technician</Text>
            <View style={styles.workerRow}>
              <View style={styles.avatarBox}>
                <Icon name="user" size={22} color={colors.brand} />
              </View>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{technician ?? 'Assigned technician'}</Text>
                {currentJob.worker?.rating != null ? (
                  <View style={styles.workerMetaRow}>
                    <Icon name="star" size={12} color={colors.brand} />
                    <Text style={styles.workerMeta}>{currentJob.worker.rating.toFixed(1)} rating</Text>
                  </View>
                ) : null}
              </View>
              {technicianCanBeCalled ? (
                <IconButton
                  onPress={callTechnician}
                  accessibilityLabel={`Call ${technician ?? 'technician'}`}
                  icon={<Icon name="phone" size={18} color={colors.brand} />}
                  backgroundColor={colors.brandSubtle}
                  size={44}
                />
              ) : null}
            </View>
          </View>
        ) : !cancelled && !isTerminalStatus(currentJob.status) ? (
          <View style={styles.dispatchingBox}>
            <Icon name="radio" size={17} color={colors.info} />
            <Text style={styles.dispatchingText}>{message.detail}</Text>
          </View>
        ) : null}

        {quote ? (
          <View style={styles.workerCard}>
            <Text style={styles.workerCardTitle}>Quote from your technician</Text>
            <Text style={styles.workerName}>{quote}</Text>
            {currentJob.quoteNotes ? <Text style={styles.workerMeta}>{currentJob.quoteNotes}</Text> : null}
          </View>
        ) : null}

        {/* Actions */}
        {canCancel ? (
          <Button
            title="Cancel request"
            onPress={confirmCancel}
            isLoading={cancel.isPending}
            variant="danger"
            size="large"
            style={styles.cancelBtn}
          />
        ) : null}
        <Button
          title="Book Another Service"
          onPress={onNewBooking}
          variant="outline"
          size="large"
          icon={<Icon name="plus" size={17} color={colors.brand} />}
          style={styles.newBookingBtn}
        />
      </Animated.ScrollView>
      <GlassHeader
        title="Tracking"
        scrollY={scrollY}
        left={
          onBack ? (
            <IconButton
              onPress={onBack}
              accessibilityLabel="Back to my requests"
              icon={<Icon name="chevron-left" size={22} color={colors.text} />}
              backgroundColor={colors.surface}
              size={44}
            />
          ) : undefined
        }
      />
    </View>
  );
};

const styles = themedStyles(() => StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  scrollFill: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  heroReason: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
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
}));
