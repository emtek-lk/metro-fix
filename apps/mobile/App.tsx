import React, { useState } from 'react';
import { StatusBar, StyleSheet, View, Text, Pressable } from 'react-native';
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
import { Icon } from './src/components/ui/Icon';
import { LoadingState } from './src/components/ui/LoadingState';
import { colors } from './src/theme/colors';
import { typography } from './src/theme/typography';
import { spacing, radius, layout } from './src/theme/layout';

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

const ROLE_MODES = [
  { id: 'worker' as const, label: 'Worker Roster', icon: 'tool' as const },
  { id: 'customer' as const, label: 'Customer View', icon: 'user' as const },
];

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
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Preparing your workspace…" />
      </SafeAreaView>
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top User Session Header */}
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {currentUser.fullName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userText}>
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser.fullName}
              </Text>
              <Text style={styles.userRoleBadge} numberOfLines={1}>
                {currentUser.role} PORTAL
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
            onPress={logout}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Icon name="log-out" size={15} color={colors.dangerText} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Top Role Mode Switcher Bar */}
        <View style={styles.roleBar}>
          {ROLE_MODES.map((mode) => {
            const isActive = appRoleMode === mode.id;
            return (
              <Pressable
                key={mode.id}
                style={({ pressed }) => [
                  styles.roleTab,
                  isActive && styles.roleTabActive,
                  pressed && !isActive && styles.roleTabPressed,
                ]}
                onPress={() => setAppRoleMode(mode.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={mode.label}
              >
                <Icon
                  name={mode.icon}
                  size={15}
                  color={isActive ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.roleTabText, isActive && styles.roleTabTextActive]}>
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
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
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Session header ──
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '800',
  },
  userText: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  userRoleBadge: {
    ...typography.overline,
    color: colors.brand,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSubtle,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutButtonPressed: {
    backgroundColor: colors.dangerPressed,
  },
  logoutButtonText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.dangerText,
  },

  // ── Role switcher (segmented control) ──
  roleBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing.md,
    padding: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 38,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTabPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  roleTabActive: {
    backgroundColor: colors.brand,
  },
  roleTabText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleTabTextActive: {
    color: colors.white,
  },
});
