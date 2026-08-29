import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import { apiService } from '../services/api';

import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { MetaChip } from './ui/MetaChip';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout } from '../theme/layout';
import { elevation } from '../theme/elevation';
import { PILLAR_ICON, FACILITY_ICON } from '../theme/status';

interface NewJobAlertModalProps {
  visible: boolean;
  job: ServiceRequest | null;
  distanceKm?: number;
  workerId: string;
  onAccept: (updatedJob: ServiceRequest) => void;
  onReject: () => void;
}

export const NewJobAlertModal: React.FC<NewJobAlertModalProps> = ({
  visible,
  job,
  distanceKm = 3.2,
  workerId,
  onAccept,
  onReject,
}) => {
  const insets = useSafeAreaInsets();
  const [loadingAction, setLoadingAction] = useState<'accept' | 'reject' | null>(
    null,
  );

  if (!job) return null;

  const handleAccept = async () => {
    setLoadingAction('accept');
    try {
      const updated = await apiService.updateJobStatus(
        job.id,
        JobStatus.ASSIGNED,
        workerId,
      );
      onAccept(updated);
    } catch (error) {
      console.error('Failed to accept job:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    setLoadingAction('reject');
    try {
      await apiService.updateJobStatus(job.id, JobStatus.REQUESTED, null);
      onReject();
    } catch (error) {
      console.error('Failed to reject job:', error);
      onReject();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, { paddingBottom: spacing.xxl + insets.bottom }]}>
          <View style={styles.handle} />

          <View style={styles.badgeRow}>
            <View style={styles.alertBadge}>
              <Icon name="zap" size={13} color={colors.white} />
              <Text style={styles.alertBadgeText}>Dispatch incoming</Text>
            </View>
            <View style={styles.distanceGroup}>
              <Icon name="map-pin" size={13} color={colors.textSecondary} />
              <Text style={styles.distanceText}>{distanceKm} km away</Text>
            </View>
          </View>

          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.description}>{job.description}</Text>

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
              <Text style={styles.locationLabel}>Location</Text>
              <Text style={styles.locationValue}>
                {job.location
                  ? `${job.location.latitude.toFixed(4)}, ${job.location.longitude.toFixed(4)}`
                  : 'Coordinates unavailable'}
              </Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <Button
              title="Accept Job"
              onPress={handleAccept}
              isLoading={loadingAction === 'accept'}
              disabled={loadingAction !== null}
              variant="primary"
              size="large"
            />
            <Button
              title="Decline"
              onPress={handleReject}
              isLoading={loadingAction === 'reject'}
              disabled={loadingAction !== null}
              variant="danger"
              size="large"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl + 4,
    borderTopRightRadius: radius.xxl + 4,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    ...elevation.e3,
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
  distanceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  distanceText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
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
});
