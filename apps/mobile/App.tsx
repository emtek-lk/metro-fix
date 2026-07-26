import React, { useState } from 'react';
import { StatusBar, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { JobStatus, ServiceRequest, ServicePillar, FacilityType } from '@metro-fix/core-types';
import { ActiveJobDashboard } from './src/components/ActiveJobDashboard';
import { NewJobAlertModal } from './src/components/NewJobAlertModal';
import { CustomerBookingWizard } from './src/components/CustomerBookingWizard';
import { CustomerTrackingView } from './src/components/CustomerTrackingView';

const MOCK_CUSTOMER_ID = 'cust_metro_101';
const MOCK_WORKER_ID = 'wrk_demo_88';
const MOCK_WORKER_NAME = 'Alex Rivers (Field Tech #88)';

const SAMPLE_INCOMING_JOB: ServiceRequest = {
  id: 'job_dispatch_909',
  title: 'Commercial HVAC Roof Chiller Fault',
  description: 'Primary compressor circuit pressure drop detected. Requires diagnostic inspection and quote.',
  servicePillar: ServicePillar.HARD,
  facilityType: FacilityType.COMMERCIAL,
  status: JobStatus.PENDING_ACCEPTANCE,
  customerId: MOCK_CUSTOMER_ID,
  workerId: MOCK_WORKER_ID,
  location: { latitude: 37.7749, longitude: -122.4194 },
  createdAt: new Date().toISOString(),
};

function App() {
  const [appRoleMode, setAppRoleMode] = useState<'customer' | 'worker'>('customer');

  // Customer Portal State
  const [customerActiveJob, setCustomerActiveJob] = useState<ServiceRequest | null>(null);

  // Worker Portal State
  const [workerActiveJob, setWorkerActiveJob] = useState<ServiceRequest | null>(null);
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [incomingJob, setIncomingJob] = useState<ServiceRequest | null>(null);

  // Handlers
  const handleBookingComplete = (newJob: ServiceRequest) => {
    setCustomerActiveJob(newJob);
  };

  const handleSimulateAlert = () => {
    setIncomingJob(SAMPLE_INCOMING_JOB);
    setAlertVisible(true);
  };

  const handleAcceptAlert = (acceptedJob: ServiceRequest) => {
    setAlertVisible(false);
    setWorkerActiveJob(acceptedJob);
  };

  const handleRejectAlert = () => {
    setAlertVisible(false);
    setIncomingJob(null);
  };

  const handleWorkerJobStatusChange = (updatedJob: ServiceRequest) => {
    setWorkerActiveJob(updatedJob);
    // Sync with customer tracking if tracking same job
    if (customerActiveJob && customerActiveJob.id === updatedJob.id) {
      setCustomerActiveJob(updatedJob);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1c2d40" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Role Mode Switcher Bar */}
          <View style={styles.roleBar}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                appRoleMode === 'customer' && styles.roleTabActive,
              ]}
              onPress={() => setAppRoleMode('customer')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.roleTabText,
                  appRoleMode === 'customer' && styles.roleTabTextActive,
                ]}
              >
                📱 CUSTOMER APP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                appRoleMode === 'worker' && styles.roleTabActive,
              ]}
              onPress={() => setAppRoleMode('worker')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.roleTabText,
                  appRoleMode === 'worker' && styles.roleTabTextActive,
                ]}
              >
                👨‍🔧 WORKER APP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Render Active View */}
          {appRoleMode === 'customer' ? (
            customerActiveJob ? (
              <CustomerTrackingView
                job={customerActiveJob}
                onNewBooking={() => setCustomerActiveJob(null)}
              />
            ) : (
              <CustomerBookingWizard
                customerId={MOCK_CUSTOMER_ID}
                onBookingComplete={handleBookingComplete}
              />
            )
          ) : (
            <ActiveJobDashboard
              workerId={MOCK_WORKER_ID}
              workerName={MOCK_WORKER_NAME}
              activeJob={workerActiveJob}
              onJobStatusChange={handleWorkerJobStatusChange}
              onSimulateDispatchAlert={handleSimulateAlert}
            />
          )}

          {/* Global Dispatch Alert Modal */}
          <NewJobAlertModal
            visible={alertVisible}
            job={incomingJob}
            distanceKm={2.4}
            workerId={MOCK_WORKER_ID}
            onAccept={handleAcceptAlert}
            onReject={handleRejectAlert}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1c2d40',
  },
  container: {
    flex: 1,
    backgroundColor: '#1c2d40',
  },
  roleBar: {
    flexDirection: 'row',
    backgroundColor: '#2b435f',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  roleTabActive: {
    backgroundColor: '#f38808',
  },
  roleTabText: {
    color: '#81b1b3',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleTabTextActive: {
    color: '#ffffff',
  },
});

export default App;
