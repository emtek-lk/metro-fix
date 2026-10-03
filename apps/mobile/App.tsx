import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JobStatus, ServiceRequest, ServicePillar, FacilityType, Role } from '@metro-fix/core-types';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NewJobAlertModal } from './src/components/NewJobAlertModal';
import { CustomerBookingWizard } from './src/components/CustomerBookingWizard';
import { CustomerTrackingView } from './src/components/CustomerTrackingView';
import { WorkerDashboard } from './src/components/WorkerDashboard';
import { JobDetail } from './src/components/JobDetail';
import { JobHistoryScreen } from './src/components/JobHistory';
import { NotificationsScreen } from './src/components/Notifications';
import { ProfileScreen } from './src/components/Profile';
import { MobileLoginScreen } from './src/components/MobileLoginScreen';
import { FloatingTabBar, type TabItem } from './src/components/ui/FloatingTabBar';
import { LoadingState } from './src/components/ui/LoadingState';
import { AppBackground } from './src/components/ui/AppBackground';
import { UnsupportedRoleScreen } from './src/components/UnsupportedRoleScreen';
import { apiService } from './src/services/api';
import { colors } from './src/theme/colors';
import { ThemeProvider, ThemeBoundary, ThemedStatusBar } from './src/theme/ThemeProvider';
import { themedStyles } from './src/theme/themedStyles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const MOCK_CUSTOMER_ID = 'cust_metro_101';

// Template for the "Simulate incoming job" action, which creates a real job via the API.
const SAMPLE_JOB_INPUT = {
  title: 'Commercial HVAC Roof Chiller Fault',
  description: 'Primary compressor circuit pressure drop detected. Requires diagnostic inspection and quote.',
  servicePillar: ServicePillar.HARD,
  facilityType: FacilityType.COMMERCIAL,
  location: { latitude: 37.7749, longitude: -122.4194 },
};

const WORKER_TABS: TabItem[] = [
  { id: 'jobs', label: 'Roster', icon: 'home' },
  { id: 'history', label: 'History', icon: 'clipboard' },
  { id: 'alerts', label: 'Alerts', icon: 'bell' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

const CUSTOMER_TABS: TabItem[] = [
  { id: 'book', label: 'Request', icon: 'plus-circle' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

function MainApp() {
  const { user: currentUser, isLoading: isAuthLoading, isAuthenticated } = useAuth();
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
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Preparing your workspace…" />
      </SafeAreaView>
    );
  }

  // Login View if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <MobileLoginScreen />;
  }

  // Each account sees only its own app: workers get the roster, customers get booking.
  // Admin / customer-care accounts work from the web dashboard.
  const isWorker = currentUser.role === Role.WORKER;
  const isCustomer = currentUser.role === Role.CUSTOMER;
  if (!isWorker && !isCustomer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <UnsupportedRoleScreen role={currentUser.role} />
      </SafeAreaView>
    );
  }

  const tabs = isWorker ? WORKER_TABS : CUSTOMER_TABS;
  // A tab left over from another role (e.g. after switching accounts) falls back to the first.
  const currentTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0].id;

  // Handlers
  const handleBookingComplete = (newJob: ServiceRequest) => {
    setCustomerActiveJob(newJob);
  };

  const handleSimulateAlert = async () => {
    try {
      // Create a real REQUESTED job, then ping this worker so accept / reject hit real data.
      const created = await apiService.createJob({
        ...SAMPLE_JOB_INPUT,
        customerId: currentUser.id || MOCK_CUSTOMER_ID,
      });
      const pinged = await apiService.updateJobStatus(
        created.id,
        JobStatus.PENDING_ACCEPTANCE,
        currentUser.id,
      );
      setIncomingJob(pinged);
      setAlertVisible(true);
    } catch (error) {
      console.error('Failed to simulate incoming job:', error);
    }
  };

  const handleAcceptAlert = (acceptedJob: ServiceRequest) => {
    setAlertVisible(false);
    setSelectedJobForDetail(acceptedJob);
  };

  const handleRejectAlert = () => {
    setAlertVisible(false);
    setIncomingJob(null);
  };

  const renderWorkerContent = () => {
    if (selectedJobForDetail) {
      return (
        <JobDetail
          job={selectedJobForDetail}
          workerId={currentUser.id}
          onBack={() => setSelectedJobForDetail(null)}
          onJobUpdated={(updated) => {
            setSelectedJobForDetail(updated);
          }}
        />
      );
    }
    if (currentTab === 'history') return <JobHistoryScreen />;
    if (currentTab === 'alerts') return <NotificationsScreen onSimulateAlert={handleSimulateAlert} />;
    if (currentTab === 'profile') return <ProfileScreen />;
    return (
      <WorkerDashboard
        workerId={currentUser.id}
        workerName={currentUser.fullName}
        onSelectJob={(job) => setSelectedJobForDetail(job)}
        onOpenAlerts={() => setActiveTab('alerts')}
      />
    );
  };

  const renderCustomerContent = () => {
    if (currentTab === 'profile') return <ProfileScreen />;
    if (customerActiveJob) {
      return (
        <CustomerTrackingView
          job={customerActiveJob}
          onNewBooking={() => setCustomerActiveJob(null)}
        />
      );
    }
    return (
      <CustomerBookingWizard
        customerId={currentUser.id || MOCK_CUSTOMER_ID}
        onBookingComplete={handleBookingComplete}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {isWorker ? renderWorkerContent() : renderCustomerContent()}

        {/* Global Dispatch Alert Modal (workers) */}
        {isWorker && (
          <NewJobAlertModal
            visible={alertVisible}
            job={incomingJob}
            distanceKm={2.4}
            workerId={currentUser.id}
            onAccept={handleAcceptAlert}
            onReject={handleRejectAlert}
          />
        )}

        {/* Floating Pill Bottom Navigation Bar */}
        {!(isWorker && selectedJobForDetail) && (
          <FloatingTabBar activeTab={currentTab} onTabPress={setActiveTab} tabs={tabs} />
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <AuthProvider>
            {/* Remounts the UI when the theme changes; auth and the query cache stay above it. */}
            <ThemeBoundary>
              <View style={styles.root}>
                <AppBackground />
                <MainApp />
              </View>
            </ThemeBoundary>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
}));
