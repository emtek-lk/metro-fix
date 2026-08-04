import React, { useState } from 'react';
import { StatusBar, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JobStatus, ServiceRequest, ServicePillar, FacilityType } from '@metro-fix/core-types';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActiveJobDashboard } from './src/components/ActiveJobDashboard';
import { NewJobAlertModal } from './src/components/NewJobAlertModal';
import { CustomerBookingWizard } from './src/components/CustomerBookingWizard';
import { CustomerTrackingView } from './src/components/CustomerTrackingView';
import { WorkerDashboard } from './src/components/WorkerDashboard';
import { JobDetail } from './src/components/JobDetail';
import { JobHistoryScreen } from './src/components/JobHistory';
import { NotificationsScreen } from './src/components/Notifications';
import { ProfileScreen } from './src/components/Profile';
import { MobileLoginScreen } from './src/components/MobileLoginScreen';
import { FloatingTabBar } from './src/components/ui/FloatingTabBar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const MOCK_CUSTOMER_ID = 'cust_metro_101';

const SAMPLE_INCOMING_JOB: ServiceRequest = {
  id: 'job_dispatch_909',
  title: 'Commercial HVAC Roof Chiller Fault',
  description: 'Primary compressor circuit pressure drop detected. Requires diagnostic inspection and quote.',
  servicePillar: ServicePillar.HARD,
  facilityType: FacilityType.COMMERCIAL,
  status: JobStatus.PENDING_ACCEPTANCE,
  customerId: MOCK_CUSTOMER_ID,
  workerId: 'wrk_demo_88',
  location: { latitude: 37.7749, longitude: -122.4194 },
  createdAt: new Date().toISOString(),
};

function MainApp() {
  const { user: currentUser, isLoading: isAuthLoading, isAuthenticated, logout } = useAuth();
  const [appRoleMode, setAppRoleMode] = useState<'customer' | 'worker'>('worker');
  const [activeTab, setActiveTab] = useState<string>('jobs');

  // Customer Portal State
  const [customerActiveJob, setCustomerActiveJob] = useState<ServiceRequest | null>(null);

  // Worker Portal State
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<ServiceRequest | null>(null);
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [incomingJob, setIncomingJob] = useState<ServiceRequest | null>(null);

  // Loading State
  if (isAuthLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Initializing Metro-Fix Workstation...</Text>
      </View>
    );
  }

  // Login View if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <MobileLoginScreen />;
  }

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
    setSelectedJobForDetail(acceptedJob);
  };

  const handleRejectAlert = () => {
    setAlertVisible(false);
    setIncomingJob(null);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top User Session Header */}
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{currentUser.fullName?.charAt(0) || 'U'}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{currentUser.fullName}</Text>
                <Text style={styles.userRoleBadge}>{currentUser.role} PORTAL</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Top Role Mode Switcher Bar */}
          <View style={styles.roleBar}>
            <TouchableOpacity
              style={[styles.roleTab, appRoleMode === 'worker' && styles.roleTabActive]}
              onPress={() => setAppRoleMode('worker')}
              activeOpacity={0.8}
            >
              <Text style={[styles.roleTabText, appRoleMode === 'worker' && styles.roleTabTextActive]}>
                👨‍🔧 WORKER ROSTER
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleTab, appRoleMode === 'customer' && styles.roleTabActive]}
              onPress={() => setAppRoleMode('customer')}
              activeOpacity={0.8}
            >
              <Text style={[styles.roleTabText, appRoleMode === 'customer' && styles.roleTabTextActive]}>
                📱 CUSTOMER VIEW
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
                customerId={currentUser.id || MOCK_CUSTOMER_ID}
                onBookingComplete={handleBookingComplete}
              />
            )
          ) : selectedJobForDetail ? (
            <JobDetail
              job={selectedJobForDetail}
              workerId={currentUser.id}
              onBack={() => setSelectedJobForDetail(null)}
              onJobUpdated={(updated) => {
                setSelectedJobForDetail(updated);
              }}
            />
          ) : activeTab === 'history' ? (
            <JobHistoryScreen />
          ) : activeTab === 'alerts' ? (
            <NotificationsScreen onSimulateAlert={handleSimulateAlert} />
          ) : activeTab === 'profile' ? (
            <ProfileScreen />
          ) : (
            <WorkerDashboard
              workerId={currentUser.id}
              workerName={currentUser.fullName}
              onSelectJob={(job) => setSelectedJobForDetail(job)}
              onSimulateDispatchAlert={handleSimulateAlert}
            />
          )}

          {/* Global Dispatch Alert Modal */}
          <NewJobAlertModal
            visible={alertVisible}
            job={incomingJob}
            distanceKm={2.4}
            workerId={currentUser.id}
            onAccept={handleAcceptAlert}
            onReject={handleRejectAlert}
          />

          {/* Floating Pill Bottom Navigation Bar */}
          {!selectedJobForDetail && (
            <FloatingTabBar
              activeTab={activeTab}
              onTabPress={(tabId) => {
                setActiveTab(tabId);
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  userRoleBadge: {
    color: '#F97316',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  roleBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  roleTabActive: {
    backgroundColor: '#F97316',
  },
  roleTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
});
