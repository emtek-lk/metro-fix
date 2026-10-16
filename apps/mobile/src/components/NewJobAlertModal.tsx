import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Modal, View, StyleSheet } from 'react-native';
import { Text } from './ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceRequest, OFFER_TIMEOUT_SECONDS } from '@metro-fix/core-types';
import { offerWindowSeconds } from '../lib/countdown';
import { haptics } from '../lib/haptics';
import { getErrorMessage } from '../lib/errors';
import { customerNameOf, coordinatesOf } from '../lib/jobs';
import { formatCountdown, fractionLeft, secondsUntil } from '../lib/countdown';
import { useCountdown } from '../hooks/useCountdown';
import { useAcceptOffer, useDeclineOffer } from '../hooks/useJobs';

import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { MetaChip } from './ui/MetaChip';
import { GlassSurface } from './ui/GlassSurface';
import { ToastHost, useToast } from './ui/Toast';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { PILLAR_ICON, FACILITY_ICON } from '../theme/status';
import { themedStyles } from '../theme/themedStyles';

interface NewJobAlertModalProps {
  visible: boolean;
  /** The job on offer (status PENDING_ACCEPTANCE, with `offerExpiresAt`). */
  job: ServiceRequest | null;
  /** The worker accepted; the job is theirs now. */
  onAccepted: (job: ServiceRequest) => void;
  /** The worker declined; the job went back to dispatch. */
  onDeclined: () => void;
  /** The time ran out, or the offer was withdrawn or taken; there is nothing left to answer. */
  onExpired: () => void;
  /**
   * The sheet was dismissed without answering (Android Back). The offer stays open on the roster
   * until it is answered or lapses, so this must never decline it.
   */
  onDismiss: () => void;
}

/**
 * The sheet a worker sees when dispatch offers them a job. It counts down the time they have,
 * and accepting or declining calls the API directly. If the offer lapses while the sheet is open
 * it closes itself, because the server has already put the job back in the queue.
 */
export const NewJobAlertModal: React.FC<NewJobAlertModalProps> = ({
  visible,
  job,
  onAccepted,
  onDeclined,
  onExpired,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const accept = useAcceptOffer();
  const decline = useDeclineOffer();
  const [action, setAction] = useState<'accept' | 'decline' | null>(null);

  const open = visible && !!job;
  const secondsLeft = useCountdown(open ? job?.offerExpiresAt : null, onExpired);
  const timedOut = open && secondsLeft <= 0;

  // A new offer is time-sensitive, so nudge the worker when it appears.
  const offerId = job?.id;
  useEffect(() => {
    if (!open || !job) return;
    haptics.warning();
    AccessibilityInfo.announceForAccessibility?.(
      `New job offer: ${job.title}. You have ${secondsUntil(job.offerExpiresAt)} seconds to respond.`,
    );
    setAction(null);
    // Only when a different offer arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, offerId]);

  if (!job) return null;

  const handleAccept = async () => {
    setAction('accept');
    try {
      const accepted = await accept.mutateAsync(job.id);
      haptics.success();
      onAccepted(accepted);
    } catch (error) {
      haptics.error();
      toast.error(getErrorMessage(error, 'Could not accept this job.'), 'Offer unavailable');
      // The usual reasons (expired, withdrawn, someone else) all mean there is nothing to answer.
      onExpired();
    } finally {
      setAction(null);
    }
  };

  const handleDecline = async () => {
    setAction('decline');
    try {
      await decline.mutateAsync({ jobId: job.id });
      onDeclined();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not decline this job.'), 'Decline failed');
      onExpired();
    } finally {
      setAction(null);
    }
  };

  const coordinates = coordinatesOf(job);
  const urgent = secondsLeft <= 15;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <ToastHost />
        <GlassSurface
          borderRadius={radius.xxl + 4}
          tintColor={colors.glassStrong}
          style={[styles.card, { marginBottom: insets.bottom + spacing.sm }]}
        >
          <View style={styles.cardInner}>
            <View style={styles.handle} />

            <View style={styles.badgeRow}>
              <View style={styles.alertBadge}>
                <Icon name="zap" size={13} color={colors.white} />
                <Text style={styles.alertBadgeText}>New job offer</Text>
              </View>
              <View
                style={styles.timerGroup}
                accessibilityRole="timer"
                accessibilityLabel={`${secondsLeft} seconds left to respond`}
              >
                <Icon name="clock" size={13} color={urgent ? colors.danger : colors.textSecondary} />
                <Text style={[styles.timerText, urgent && styles.timerTextUrgent]}>
                  {timedOut ? 'Expired' : formatCountdown(secondsLeft)}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  urgent && styles.progressFillUrgent,
                  { width: `${fractionLeft(secondsLeft, offerWindowSeconds(job, OFFER_TIMEOUT_SECONDS)) * 100}%` },
                ]}
              />
            </View>

            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.description} numberOfLines={4}>
              {job.description}
            </Text>

            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Service pillar</Text>
                <MetaChip
                  icon={PILLAR_ICON[job.servicePillar] ?? 'tool'}
                  label={job.servicePillar}
                  tint={colors.brand}
                />
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Facility type</Text>
                <MetaChip
                  icon={FACILITY_ICON[job.facilityType] ?? 'home'}
                  label={job.facilityType}
                />
              </View>
            </View>

            <View style={styles.locationBox}>
              <Icon name="navigation" size={16} color={colors.info} />
              <View style={styles.locationTextCol}>
                <Text style={styles.locationLabel}>{customerNameOf(job)}</Text>
                <Text style={styles.locationValue}>{coordinates ?? 'Location to be confirmed'}</Text>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <Button
                title="Accept job"
                onPress={handleAccept}
                isLoading={action === 'accept'}
                disabled={action !== null || timedOut}
                variant="primary"
                size="large"
              />
              <Button
                title="Decline"
                onPress={handleDecline}
                isLoading={action === 'decline'}
                disabled={action !== null || timedOut}
                variant="danger"
                size="large"
              />
            </View>
          </View>
        </GlassSurface>
      </View>
    </Modal>
  );
};

const styles = themedStyles(() => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  card: {
    marginHorizontal: spacing.sm,
  },
  cardInner: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },

  // ── Badges ──
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  alertBadgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.white,
  },
  timerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  timerText: {
    ...typography.bodyStrong,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
  timerTextUrgent: {
    color: colors.danger,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.brand,
  },
  progressFillUrgent: {
    backgroundColor: colors.danger,
  },

  // ── Content ──
  title: {
    ...typography.h1,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  detailItem: {
    flex: 1,
    gap: spacing.sm,
  },
  detailLabel: {
    ...typography.overline,
    color: colors.textMuted,
  },

  // ── Location ──
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationTextCol: {
    flex: 1,
    minWidth: 0,
  },
  locationLabel: {
    ...typography.overline,
    color: colors.textMuted,
  },
  locationValue: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: 2,
  },

  buttonGroup: {
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
}));
