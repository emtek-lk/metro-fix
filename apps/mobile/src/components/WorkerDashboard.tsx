import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ServiceRequest, JobStatus } from '@metro-fix/core-types';

import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
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
  // 1. Fetch real jobs data using useWorkerJobs React Query hook
  const { data: jobs = [], isLoading, isError, error, isRefetching, refetch } = useWorkerJobs();

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.ON_ROUTE:
        return '#3B82F6';
      case JobStatus.INSPECTION:
        return '#8B5CF6';
      case JobStatus.IN_PROGRESS:
        return '#F97316';
      case JobStatus.COMPLETED:
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  // 2. Render each assigned job inside our Soft UI Card primitive
  const renderJobItem = ({ item }: { item: ServiceRequest }) => {
    return (
      <TouchableOpacity
        onPress={() => onSelectJob(item)}
        activeOpacity={0.88}
        style={styles.cardContainer}
      >
        <Card variant="elevated" borderRadius={28} padding={20}>
          {/* Card Header: Job ID & Status Badge */}
          <View style={styles.cardHeader}>
            <Text style={styles.ticketId}>TICKET #{item.id.slice(-6).toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusBadgeText}>{item.status}</Text>
            </View>
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
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>⚡ {item.servicePillar}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>🏢 {item.facilityType}</Text>
            </View>
          </View>

          {/* Customer Name / Address / GPS */}
          <View style={styles.cardFooter}>
            <View style={styles.customerBox}>
              <Text style={styles.customerName}>
                👤 {(item as any).customerName || `Customer #${item.customerId?.slice(-4) || 'Ref'}`}
              </Text>
              <Text style={styles.locationText} numberOfLines={1}>
                📍{' '}
                {(item as any).address ||
                  (item.location
                    ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`
                    : 'Site Address Available')}
              </Text>
            </View>
            <Text style={styles.viewAction}>VIEW →</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>ASSIGNED ROSTER & WORKLOAD</Text>
          <Text style={styles.headerTitle}>Field Dashboard</Text>
        </View>
        <IconButton
          symbol="🔔"
          onPress={onSimulateDispatchAlert}
          backgroundColor="#1E293B"
          color="#F97316"
          size={44}
        />
      </View>

      {/* 3. Handle Loading State */}
      {isLoading ? (
        <View style={styles.centeredBox}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loaderText}>Syncing Assigned Workload...</Text>
        </View>
      ) : isError ? (
        /* 4. Handle Error State with Retry Button */
        <View style={styles.centeredBox}>
          <Card variant="bordered" borderRadius={28} padding={24} style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠️ Sync Connection Failed</Text>
            <Text style={styles.errorText}>
              {error?.message || 'Could not retrieve assigned workload from backend API.'}
            </Text>
            <Button
              title="RETRY SYNC"
              onPress={() => refetch()}
              variant="primary"
              size="medium"
              style={{ marginTop: 16 }}
            />
          </Card>
        </View>
      ) : (
        /* 5. FlatList Rendering & Pull-To-Refresh */
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#F97316"
              colors={['#F97316']}
            />
          }
          ListEmptyComponent={
            <Card variant="bordered" borderRadius={28} padding={28} style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Jobs Assigned</Text>
              <Text style={styles.emptyText}>
                Your workload queue is clear. Stand by for Customer Care dispatch notifications.
              </Text>
            </Card>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketId: {
    color: '#F97316',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  jobTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  jobDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metaBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  metaBadgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  customerBox: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  locationText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  viewAction: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '800',
  },
  centeredBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  errorCard: {
    width: '100%',
    alignItems: 'center',
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCard: {
    marginTop: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
