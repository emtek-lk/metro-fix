import React, { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JobStatus, ServiceRequest, ServicePillar, FacilityType } from '@metro-fix/core-types';
import { useAuth } from '../context/AuthContext';
import { NewJobAlertModal } from '../components/NewJobAlertModal';
import { WorkerDashboard } from '../components/WorkerDashboard';
import { JobHistoryScreen } from '../components/JobHistory';
import { NotificationsScreen } from '../components/Notifications';
import { ProfileScreen } from '../components/Profile';
import { FloatingTabBar, type TabItem } from '../components/ui/FloatingTabBar';
import { apiService } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { ScreenShell } from './ScreenShell';
import { TabPanes } from './TabPanes';
import type { RootStackParamList } from './types';

const WORKER_TABS: TabItem[] = [
  { id: 'jobs', label: 'Roster', icon: 'home' },
  { id: 'history', label: 'History', icon: 'clipboard' },
  { id: 'alerts', label: 'Alerts', icon: 'bell' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

// Template for the "Simulate incoming job" action, which creates a real job via the API.
const SAMPLE_JOB_INPUT = {
  title: 'Commercial HVAC Roof Chiller Fault',
  description: 'Primary compressor circuit pressure drop detected. Requires diagnostic inspection and quote.',
  servicePillar: ServicePillar.HARD,
  facilityType: FacilityType.COMMERCIAL,
  location: { latitude: 37.7749, longitude: -122.4194 },
};

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

/** The worker's home: roster, history, alerts and profile behind the glass tab bar. */
export function WorkerMain({ navigation }: Props) {
  const { user } = useAuth();
  const notifications = useNotifications();
  const [activeTab, setActiveTab] = useState<string>(WORKER_TABS[0].id);
  const [alertVisible, setAlertVisible] = useState(false);
  const [incomingJob, setIncomingJob] = useState<ServiceRequest | null>(null);

  // Android back: return to the first tab before leaving the app.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (activeTab !== WORKER_TABS[0].id) {
          setActiveTab(WORKER_TABS[0].id);
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [activeTab]),
  );

  if (!user) return null;

  const openJob = (job: ServiceRequest) => navigation.navigate('JobDetail', { job });

  const handleSimulateAlert = async () => {
    try {
      // Create a real REQUESTED job, then ping this worker so accept / reject hit real data.
      const created = await apiService.createJob({ ...SAMPLE_JOB_INPUT, customerId: user.id });
      const pinged = await apiService.updateJobStatus(created.id, JobStatus.PENDING_ACCEPTANCE, user.id);
      setIncomingJob(pinged);
      setAlertVisible(true);
    } catch (error) {
      console.error('Failed to simulate incoming job:', error);
    }
  };

  const panes: Record<string, () => React.ReactNode> = {
    jobs: () => (
      <WorkerDashboard
        workerId={user.id}
        workerName={user.fullName}
        onSelectJob={openJob}
        onOpenAlerts={() => setActiveTab('alerts')}
      />
    ),
    history: () => <JobHistoryScreen />,
    alerts: () => (
      <NotificationsScreen
        notifications={notifications.items}
        unreadCount={notifications.unreadCount}
        onMarkRead={notifications.markRead}
        onMarkAllRead={notifications.markAllRead}
        onSimulateAlert={handleSimulateAlert}
      />
    ),
    profile: () => (
      <ProfileScreen onOpenGallery={__DEV__ ? () => navigation.navigate('Gallery') : undefined} />
    ),
  };

  return (
    <ScreenShell>
      <TabPanes activeTab={activeTab} panes={panes} />

      {/* Global dispatch alert */}
      <NewJobAlertModal
        visible={alertVisible}
        job={incomingJob}
        distanceKm={2.4}
        workerId={user.id}
        onAccept={(job) => {
          setAlertVisible(false);
          openJob(job);
        }}
        onReject={() => {
          setAlertVisible(false);
          setIncomingJob(null);
        }}
      />

      <FloatingTabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        tabs={WORKER_TABS}
        badges={{ alerts: notifications.unreadCount }}
      />
    </ScreenShell>
  );
}
