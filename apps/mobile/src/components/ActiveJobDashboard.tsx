import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { JobStatus, ServiceRequest, LocationCoordinates } from '@metro-fix/core-types';
import { apiService } from '../services/api';
import { openNativeNavigation } from '../services/linking';
import { startBackgroundLocationSync } from '../services/location';

interface ActiveJobDashboardProps {
  workerId: string;
  workerName: string;
  activeJob: ServiceRequest | null;
  onJobStatusChange: (updatedJob: ServiceRequest) => void;
  onSimulateDispatchAlert: () => void;
}

export const ActiveJobDashboard: React.FC<ActiveJobDashboardProps> = ({
  workerId,
  workerName,
  activeJob,
  onJobStatusChange,
  onSimulateDispatchAlert,
}) => {
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [currentCoords, setCurrentCoords] = useState<LocationCoordinates>({
    latitude: 37.78825,
    longitude: -122.4324,
  });

  useEffect(() => {
    const stopSync = startBackgroundLocationSync(workerId, (coords) => {
      setCurrentCoords(coords);
    });
    return () => stopSync();
  }, [workerId]);

  const handleProgressState = async (nextStatus: JobStatus) => {
    if (!activeJob) return;
    setLoadingStatus(true);
    try {
      const updated = await apiService.updateJobStatus(
        activeJob.id,
        nextStatus,
        workerId,
      );
      onJobStatusChange(updated);
    } catch (error: any) {
      Alert.alert('Status Update Failed', error?.message || 'Could not update status');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleNavigate = () => {
    if (!activeJob || !activeJob.location) return;
    openNativeNavigation({
      latitude: activeJob.location.latitude,
      longitude: activeJob.location.longitude,
      label: activeJob.title,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>FIELD WORKER PORTAL</Text>
          <Text style={styles.workerName}>{workerName}</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.greenDot} />
          <Text style={styles.statusPillText}>GPS ACTIVE</Text>
        </View>
      </View>

      {/* GPS Telemetry Bar */}
      <View style={styles.telemetryBar}>
        <Text style={styles.telemetryText}>
          Current Location: {currentCoords.latitude.toFixed(4)}, {currentCoords.longitude.toFixed(4)}
        </Text>
      </View>

      {/* Main Active Job Card */}
      {activeJob ? (
        <View style={styles.jobCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>ACTIVE SERVICE REQUEST</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{activeJob.status}</Text>
            </View>
          </View>

          <Text style={styles.jobTitle}>{activeJob.title}</Text>
          <Text style={styles.jobDesc}>{activeJob.description}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>PILLAR</Text>
              <Text style={styles.infoValue}>{activeJob.servicePillar}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>FACILITY</Text>
              <Text style={styles.infoValue}>{activeJob.facilityType}</Text>
            </View>
          </View>

          {/* Navigation Action */}
          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={handleNavigate}
            activeOpacity={0.8}
          >
            <Text style={styles.navigateBtnText}>📍 NAVIGATE TO SITE (MAPS)</Text>
          </TouchableOpacity>

          {/* Execution State Controls */}
          <View style={styles.actionSection}>
            <Text style={styles.actionSectionTitle}>STAGE CONTROL</Text>

            {activeJob.status === JobStatus.ASSIGNED && (
              <TouchableOpacity
                style={[styles.massiveBtn, styles.btnOrange]}
                onPress={() => handleProgressState(JobStatus.ON_ROUTE)}
                disabled={loadingStatus}
              >
                {loadingStatus ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.massiveBtnText}>🚀 START ROUTE (ON ROUTE)</Text>
                )}
              </TouchableOpacity>
            )}

            {activeJob.status === JobStatus.ON_ROUTE && (
              <TouchableOpacity
                style={[styles.massiveBtn, styles.btnBlue]}
                onPress={() => handleProgressState(JobStatus.INSPECTION)}
                disabled={loadingStatus}
              >
                {loadingStatus ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.massiveBtnText}>🏁 ARRIVED AT SITE (INSPECTION)</Text>
                )}
              </TouchableOpacity>
            )}

            {activeJob.status === JobStatus.INSPECTION && (
              <TouchableOpacity
                style={[styles.massiveBtn, styles.btnPurple]}
                onPress={() => handleProgressState(JobStatus.IN_PROGRESS)}
                disabled={loadingStatus}
              >
                {loadingStatus ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.massiveBtnText}>⚡ START WORK (IN PROGRESS)</Text>
                )}
              </TouchableOpacity>
            )}

            {activeJob.status === JobStatus.IN_PROGRESS && (
              <TouchableOpacity
                style={[styles.massiveBtn, styles.btnGreen]}
                onPress={() => handleProgressState(JobStatus.COMPLETED)}
                disabled={loadingStatus}
              >
                {loadingStatus ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.massiveBtnText}>✅ COMPLETE & REQUEST PAYMENT</Text>
                )}
              </TouchableOpacity>
            )}

            {activeJob.status === JobStatus.COMPLETED && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedBannerText}>
                  🎉 JOB COMPLETED - WAITING FOR NEXT DISPATCH
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Active Jobs Assigned</Text>
          <Text style={styles.emptyText}>
            You are currently on standby. New dispatch pings will pop up automatically.
          </Text>

          <TouchableOpacity
            style={styles.demoSimulateBtn}
            onPress={onSimulateDispatchAlert}
            activeOpacity={0.8}
          >
            <Text style={styles.demoSimulateBtnText}>
              🔔 TEST DISPATCH ALERT (FCM MOCK)
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  kicker: {
    color: '#81b1b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  workerName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 173, 131, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4aad83',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4aad83',
    marginRight: 6,
  },
  statusPillText: {
    color: '#4aad83',
    fontSize: 11,
    fontWeight: '800',
  },
  telemetryBar: {
    backgroundColor: '#2b435f',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
  },
  telemetryText: {
    color: '#81b1b3',
    fontSize: 12,
    fontWeight: '600',
  },
  jobCard: {
    backgroundColor: '#2b435f',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#81b1b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusBadge: {
    backgroundColor: '#f38808',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  jobDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#81b1b3',
    fontWeight: '700',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '800',
  },
  navigateBtn: {
    backgroundColor: 'rgba(243, 136, 8, 0.15)',
    borderWidth: 1.5,
    borderColor: '#f38808',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  navigateBtnText: {
    color: '#f38808',
    fontSize: 15,
    fontWeight: '800',
  },
  actionSection: {
    gap: 10,
  },
  actionSectionTitle: {
    color: '#81b1b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  massiveBtn: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  massiveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnOrange: { backgroundColor: '#f38808' },
  btnBlue: { backgroundColor: '#2b6cb0' },
  btnPurple: { backgroundColor: '#6b46c1' },
  btnGreen: { backgroundColor: '#2f855a' },
  completedBanner: {
    backgroundColor: 'rgba(74, 173, 131, 0.2)',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  completedBannerText: {
    color: '#4aad83',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#2b435f',
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#81b1b3',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  demoSimulateBtn: {
    backgroundColor: '#f38808',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  demoSimulateBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
