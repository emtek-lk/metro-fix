import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import { realtimeSocket } from '../services/websocket';

interface CustomerTrackingViewProps {
  job: ServiceRequest;
  onNewBooking: () => void;
}

const LIFECYCLE_STAGES: { status: JobStatus; label: string; icon: string }[] = [
  { status: JobStatus.REQUESTED, label: 'Requested', icon: '📝' },
  { status: JobStatus.PENDING_ACCEPTANCE, label: 'Dispatching', icon: '📡' },
  { status: JobStatus.ASSIGNED, label: 'Technician Assigned', icon: '👨‍🔧' },
  { status: JobStatus.ON_ROUTE, label: 'Worker On Route', icon: '🚗' },
  { status: JobStatus.INSPECTION, label: 'Inspection / Quote', icon: '🔍' },
  { status: JobStatus.IN_PROGRESS, label: 'Work In Progress', icon: '⚙️' },
  { status: JobStatus.COMPLETED, label: 'Completed & Paid', icon: '✅' },
];

export const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({
  job: initialJob,
  onNewBooking,
}) => {
  const [currentJob, setCurrentJob] = useState<ServiceRequest>(initialJob);

  useEffect(() => {
    // Listen to real-time WebSocket update events from NestJS backend
    const unsubscribe = realtimeSocket.on('job.updated', (updatedJob) => {
      if (updatedJob.id === currentJob.id) {
        console.log('[CustomerTrackingView] Real-time status update received:', updatedJob.status);
        setCurrentJob(updatedJob);
      }
    });

    return () => unsubscribe();
  }, [currentJob.id]);

  const currentStageIndex = LIFECYCLE_STAGES.findIndex(
    (s) => s.status === currentJob.status,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.kicker}>LIVE SERVICE TRACKING</Text>
          <View style={styles.liveBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.liveBadgeText}>WEBSOCKET LIVE</Text>
          </View>
        </View>
        <Text style={styles.title}>{currentJob.title}</Text>
        <Text style={styles.ticketId}>Ticket #{currentJob.id}</Text>
      </View>

      {/* Main Status Hero Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroStatusLabel}>CURRENT STAGE</Text>
        <Text style={styles.heroStatusValue}>{currentJob.status}</Text>
        <Text style={styles.heroDesc}>{currentJob.description}</Text>
      </View>

      {/* 7-Stage Visual Lifecycle Progress Tracker */}
      <View style={styles.trackerCard}>
        <Text style={styles.trackerTitle}>SERVICE LIFECYCLE PROGRESS</Text>

        <View style={styles.stageList}>
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <View key={stage.status} style={styles.stageRow}>
                <View style={styles.stageIconCol}>
                  <View
                    style={[
                      styles.stageNode,
                      isDone && styles.stageNodeDone,
                      isCurrent && styles.stageNodeCurrent,
                    ]}
                  >
                    <Text style={styles.stageIconText}>{stage.icon}</Text>
                  </View>
                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stageConnector,
                        isDone && styles.stageConnectorDone,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.stageContentCol}>
                  <Text
                    style={[
                      styles.stageLabel,
                      isCurrent && styles.stageLabelCurrent,
                      isDone && styles.stageLabelDone,
                    ]}
                  >
                    {stage.label}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.activeTag}>IN PROGRESS AT SITE</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Assigned Technician Card */}
      {currentJob.workerId ? (
        <View style={styles.workerCard}>
          <Text style={styles.workerCardTitle}>ASSIGNED SERVICE TECHNICIAN</Text>
          <View style={styles.workerRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>👨‍🔧</Text>
            </View>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>Alex Rivers (Field Tech #88)</Text>
              <Text style={styles.workerMeta}>⭐ 4.9 Rating • Hard & Soft FM Certified</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.dispatchingBox}>
          <Text style={styles.dispatchingText}>
            📡 Customer Care is currently selecting the nearest certified technician for your site location.
          </Text>
        </View>
      )}

      {/* Action Footer */}
      <TouchableOpacity
        style={styles.newBookingBtn}
        onPress={onNewBooking}
        activeOpacity={0.8}
      >
        <Text style={styles.newBookingBtnText}>➕ BOOK ANOTHER SERVICE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c2d40',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kicker: {
    color: '#81b1b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 173, 131, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4aad83',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4aad83',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#4aad83',
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  ticketId: {
    color: '#81b1b3',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#f38808',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  heroStatusLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroStatusValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroDesc: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  trackerCard: {
    backgroundColor: '#2b435f',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackerTitle: {
    color: '#81b1b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  stageList: {
    gap: 0,
  },
  stageRow: {
    flexDirection: 'row',
    minHeight: 48,
  },
  stageIconCol: {
    width: 40,
    alignItems: 'center',
  },
  stageNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stageNodeDone: {
    backgroundColor: '#4aad83',
    borderColor: '#4aad83',
  },
  stageNodeCurrent: {
    backgroundColor: '#f38808',
    borderColor: '#ffffff',
  },
  stageIconText: {
    fontSize: 14,
  },
  stageConnector: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 2,
  },
  stageConnectorDone: {
    backgroundColor: '#4aad83',
  },
  stageContentCol: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
    paddingBottom: 16,
  },
  stageLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '700',
  },
  stageLabelCurrent: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  stageLabelDone: {
    color: '#81b1b3',
  },
  activeTag: {
    color: '#f38808',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  workerCard: {
    backgroundColor: '#2b435f',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workerCardTitle: {
    color: '#81b1b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(243, 136, 8, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  workerMeta: {
    color: '#81b1b3',
    fontSize: 12,
    marginTop: 2,
  },
  dispatchingBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  dispatchingText: {
    color: '#81b1b3',
    fontSize: 13,
    lineHeight: 18,
  },
  newBookingBtn: {
    backgroundColor: '#2b435f',
    borderWidth: 1.5,
    borderColor: '#f38808',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBookingBtnText: {
    color: '#f38808',
    fontSize: 14,
    fontWeight: '800',
  },
});
