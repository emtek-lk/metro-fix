import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Text } from './ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';

import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { ScreenHeader } from './ui/ScreenHeader';
import { StatusPill } from './ui/StatusPill';
import { MetaChip } from './ui/MetaChip';
import { EmptyState } from './ui/EmptyState';
import { SkeletonCard } from './ui/SkeletonCard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, layout, tabBarClearance } from '../theme/layout';
import { PILLAR_ICON } from '../theme/status';
import { useWorkerJobs } from '../hooks/useJobs';
import { themedStyles } from '../theme/themedStyles';
import { shortRef } from '../lib/ticket';
import { GlassHeader, useCollapsingHeader } from './ui/GlassHeader';

export const JobHistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { data: jobs, isLoading } = useWorkerJobs();
  const { scrollY, onScroll } = useCollapsingHeader();

  const historyJobs = Array.isArray(jobs)
    ? jobs.filter(
        (j) => j.status === JobStatus.COMPLETED || j.status === JobStatus.IN_PROGRESS,
      )
    : [];

  const largeTitle = (
    <ScreenHeader
      eyebrow="Service dispatch records"
      title="Job History"
      subtitle="Completed and active service tickets"
      style={styles.largeTitle}
    />
  );
  const hasList = !isLoading && historyJobs.length > 0;

  return (
    <View style={styles.container}>
      {/* Static title while there is no list to scroll (loading / empty) */}
      {hasList ? null : <View style={styles.header}>{largeTitle}</View>}

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : historyJobs.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No historical records found"
          description="Completed tickets will accumulate here."
        />
      ) : (
        <Animated.FlatList
          data={historyJobs}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={largeTitle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarClearance(insets) },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: ServiceRequest }) => (
            <Card variant="elevated" borderRadius={radius.xl} padding={spacing.xl}>
              <View style={styles.cardHeader}>
                <Text style={[styles.ticketId, styles.ticketShrink]} numberOfLines={1}>
                  #{shortRef(item.id)}
                </Text>
                <StatusPill status={item.status} size="small" />
              </View>

              <Text style={styles.jobTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.jobDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.cardFooter}>
                <MetaChip
                  icon={PILLAR_ICON[item.servicePillar] ?? 'tool'}
                  label={item.servicePillar}
                  tint={colors.brand}
                />
                <View style={styles.dateRow}>
                  <Icon name="calendar" size={12} color={colors.textMuted} />
                  <Text style={styles.dateTag}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      <GlassHeader title="Job History" scrollY={scrollY} />
    </View>
  );
};

const styles = themedStyles(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  largeTitle: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  skeletonWrap: {
    padding: layout.screenPadding,
    gap: spacing.lg,
  },
  listContent: {
    padding: layout.screenPadding,
    gap: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  ticketShrink: {
    flexShrink: 1,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dateTag: {
    ...typography.caption,
    color: colors.textMuted,
  },
}));
