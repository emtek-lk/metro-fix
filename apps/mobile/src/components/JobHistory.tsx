import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Card } from './ui/Card';
import { useWorkerJobs } from '../hooks/useJobs';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';

export const JobHistoryScreen: React.FC = () => {
  const { data: jobs, isLoading } = useWorkerJobs();

  const historyJobs = Array.isArray(jobs)
    ? jobs.filter(
        (j) => j.status === JobStatus.COMPLETED || j.status === JobStatus.IN_PROGRESS,
      )
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📜 Job History Log</Text>
        <Text style={styles.subtitle}>Completed & Active Service Dispatch Records</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : historyJobs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyText}>No historical records found</Text>
          <Text style={styles.emptySubtext}>Completed tickets will accumulate here</Text>
        </View>
      ) : (
        <FlatList
          data={historyJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: ServiceRequest }) => (
            <Card variant="elevated" borderRadius={20} padding={16} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.ticketId}>#{item.id.slice(-6).toUpperCase()}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === JobStatus.COMPLETED ? '#10B981' : '#F97316',
                    },
                  ]}
                >
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.jobTitle}>{item.title}</Text>
              <Text style={styles.jobDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.pillarTag}>⚡ {item.servicePillar}</Text>
                <Text style={styles.dateTag}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  emptySubtext: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 110,
  },
  card: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    color: '#F97316',
    fontWeight: '800',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  jobTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  jobDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  pillarTag: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  dateTag: {
    color: '#64748B',
    fontSize: 12,
  },
});
