import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceRequest } from '@metro-fix/core-types';

import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Icon } from './ui/Icon';
import { ScreenHeader } from './ui/ScreenHeader';
import { StatusPill } from './ui/StatusPill';
import { MetaChip } from './ui/MetaChip';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { SkeletonCard } from './ui/SkeletonCard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { PILLAR_ICON, FACILITY_ICON } from '../theme/status';
import { useWorkerJobs } from '../hooks/useJobs';

export interface WorkerDashboardProps {
  workerId: string;
  workerName: string;
  onSelectJob: (job: ServiceRequest) => void;
  onSimulateDispatchAlert: () => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  workerId,
  workerName,
  onSelectJob,
  onSimulateDispatchAlert,
}) => {
  const insets = useSafeAreaInsets();

  // 1. Fetch real jobs data using useWorkerJobs React Query hook
  const { data: jobs = [], isLoading, isError, error, isRefetching, refetch } = useWorkerJobs();

  // 2. Render each assigned job inside our Soft UI Card primitive
  const renderJobItem = ({ item }: { item: ServiceRequest }) => {
    return (
      <Pressable
        onPress={() => onSelectJob(item)}
        style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open job ${item.title}`}
      >
        <Card variant="elevated" borderRadius={radius.xl} padding={spacing.xl}>
          {/* Card Header: Job ID & Status Badge */}
          <View style={styles.cardHeader}>
            <Text style={styles.ticketId}>TICKET #{item.id.slice(-6).toUpperCase()}</Text>
            <StatusPill status={item.status} size="small" />
          </View>

          {/* Job Title & Description */}
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.jobDesc} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Service Pillar & Facility Type */}
          <View style={styles.metaRow}>
            <MetaChip
              icon={PILLAR_ICON[item.servicePillar] ?? 'tool'}
              label={item.servicePillar}
              tint={colors.brand}
            />
            <MetaChip
              icon={FACILITY_ICON[item.facilityType] ?? 'home'}
              label={item.facilityType}
            />
          </View>

          {/* Customer Name / Address / GPS */}
          <View style={styles.cardFooter}>
            <View style={styles.customerBox}>
              <View style={styles.footerLine}>
                <Icon name="user" size={13} color={colors.textSecondary} />
                <Text style={styles.customerName} numberOfLines={1}>
                  {(item as any).customerName || `Customer #${item.customerId?.slice(-4) || 'Ref'}`}
                </Text>
              </View>
              <View style={styles.footerLine}>
                <Icon name="map-pin" size={13} color={colors.textMuted} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {(item as any).address ||
                    (item.location
                      ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`
                      : 'Site Address Available')}
                </Text>
              </View>
            </View>
            <View style={styles.viewAction}>
              <Text style={styles.viewActionText}>VIEW</Text>
              <Icon name="chevron-right" size={15} color={colors.brand} />
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header section */}
      <ScreenHeader
        eyebrow="Assigned roster & workload"
        title="Field Dashboard"
        style={styles.header}
        right={
          <IconButton
            onPress={onSimulateDispatchAlert}
            icon={<Icon name="bell" size={19} color={colors.brand} />}
            backgroundColor={colors.surface}
            size={44}
          />
        }
      />

      {/* 3. Handle Loading State */}
      {isLoading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : isError ? (
        /* 4. Handle Error State with Retry Button */
        <ErrorState
          title="Sync connection failed"
          message={error?.message || 'Could not retrieve assigned workload from backend API.'}
          icon="wifi-off"
          action={
            <Button title="RETRY SYNC" onPress={() => refetch()} variant="primary" size="medium" />
          }
        />
      ) : (
        /* 5. FlatList Rendering & Pull-To-Refresh */
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarClearance(insets) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="inbox"
              title="No jobs assigned"
              description="Your workload queue is clear. Stand by for Customer Care dispatch notifications."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  skeletonWrap: {
    padding: layout.screenPadding,
    gap: spacing.lg,
  },
  listContent: {
    padding: layout.screenPadding,
    gap: spacing.lg,
  },

  // ── Job card ──
  cardContainer: {
    borderRadius: radius.xl,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  ticketId: {
    ...typography.overline,
    color: colors.brand,
  },
  jobTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  jobDesc: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  customerBox: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  footerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customerName: {
    ...typography.label,
    color: colors.text,
    flexShrink: 1,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 1,
  },
  viewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  viewActionText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.brand,
  },
});
