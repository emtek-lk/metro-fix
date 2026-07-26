import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import { apiService } from '../services/api';

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
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>⚡ DISPATCH INCOMING</Text>
            </View>
            <Text style={styles.distanceText}>{distanceKm} km away</Text>
          </View>

          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.description}>{job.description}</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>SERVICE PILLAR</Text>
              <Text style={styles.detailValue}>{job.servicePillar}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>FACILITY TYPE</Text>
              <Text style={styles.detailValue}>{job.facilityType}</Text>
            </View>
          </View>

          <View style={styles.locationBox}>
            <Text style={styles.locationLabel}>LOCATION</Text>
            <Text style={styles.locationValue}>
              {job.location?.latitude?.toFixed(4)}, {job.location?.longitude?.toFixed(4)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.btn, styles.btnAccept]}
              onPress={handleAccept}
              disabled={loadingAction !== null}
              activeOpacity={0.8}
            >
              {loadingAction === 'accept' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnAcceptText}>ACCEPT JOB</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnReject]}
              onPress={handleReject}
              disabled={loadingAction !== null}
              activeOpacity={0.8}
            >
              {loadingAction === 'reject' ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnRejectText}>DECLINE</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#1c2d40',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#2b435f',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#f38808',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertBadge: {
    backgroundColor: 'rgba(243, 136, 8, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f38808',
  },
  alertBadgeText: {
    color: '#f38808',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  distanceText: {
    color: '#81b1b3',
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#81b1b3',
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  locationBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#81b1b3',
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  locationValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonGroup: {
    gap: 12,
  },
  btn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAccept: {
    backgroundColor: '#f38808',
  },
  btnAcceptText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnReject: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  btnRejectText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '700',
  },
});
