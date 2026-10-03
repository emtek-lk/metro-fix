import React, { useCallback, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import { useAuth } from '../context/AuthContext';
import { NewJobAlertModal } from '../components/NewJobAlertModal';
import { WorkerDashboard } from '../components/WorkerDashboard';
import { JobHistoryScreen } from '../components/JobHistory';
import { NotificationsScreen } from '../components/Notifications';
import { ProfileScreen } from '../components/Profile';
import { FloatingTabBar, type TabItem } from '../components/ui/FloatingTabBar';
import { useToast } from '../components/ui/Toast';
import { useNotifications } from '../hooks/useNotifications';
import { useWorkerJobs } from '../hooks/useJobs';
import { secondsUntil } from '../lib/countdown';
import { ScreenShell } from './ScreenShell';
import { TabPanes } from './TabPanes';
import type { RootStackParamList } from './types';

const WORKER_TABS: TabItem[] = [
  { id: 'jobs', label: 'Roster', icon: 'home' },
  { id: 'history', label: 'History', icon: 'clipboard' },
  { id: 'alerts', label: 'Alerts', icon: 'bell' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

/** Identifies one offer: the same job offered again later gets a new deadline, so a new key. */
const offerKey = (job: ServiceRequest) => `${job.id}:${job.offerExpiresAt ?? ''}`;

/** An offer that is still waiting for an answer and has time left. */
const isLiveOffer = (job: ServiceRequest) =>
  job.status === JobStatus.PENDING_ACCEPTANCE && secondsUntil(job.offerExpiresAt) > 0;

/** The worker's home: roster, history, alerts and profile behind the glass tab bar. */
export function WorkerMain({ navigation }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const { data: jobs } = useWorkerJobs();
  const [activeTab, setActiveTab] = useState<string>(WORKER_TABS[0].id);
  // Offers the worker has answered, let lapse, or put aside, so their sheet is not raised again.
  const [putAside, setPutAside] = useState<ReadonlySet<string>>(new Set());

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

  // The offer to show: the first live one the worker has not already dealt with. Arrives from the
  // realtime socket (instantly) or from the roster query (e.g. the app was opened mid-offer).
  const currentOffer = useMemo(
    () => (jobs ?? []).find((job) => isLiveOffer(job) && !putAside.has(offerKey(job))) ?? null,
    [jobs, putAside],
  );

  const putOfferAside = useCallback((job: ServiceRequest) => {
    setPutAside((current) => new Set(current).add(offerKey(job)));
  }, []);

  const refreshQueue = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['workerJobs'] });
  }, [queryClient]);

  if (!user) return null;

  const openJob = (job: ServiceRequest) => {
    if (job.status === JobStatus.PENDING_ACCEPTANCE) {
      // An offer is answered in its sheet; bring it back if it was put aside.
      if (isLiveOffer(job)) {
        setPutAside((current) => {
          const next = new Set(current);
          next.delete(offerKey(job));
          return next;
        });
      } else {
        refreshQueue();
      }
      return;
    }
    navigation.navigate('JobDetail', { job });
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
    history: () => <JobHistoryScreen onSelectJob={openJob} />,
    alerts: () => (
      <NotificationsScreen
        notifications={notifications.items}
        unreadCount={notifications.unreadCount}
        onMarkRead={notifications.markRead}
        onMarkAllRead={notifications.markAllRead}
      />
    ),
    profile: () => (
      <ProfileScreen onOpenGallery={__DEV__ ? () => navigation.navigate('Gallery') : undefined} />
    ),
  };

  return (
    <ScreenShell>
      <TabPanes activeTab={activeTab} panes={panes} />

      {/* A job offered to this worker, with a countdown */}
      <NewJobAlertModal
        visible={!!currentOffer}
        job={currentOffer}
        onAccepted={(job) => {
          putOfferAside(job);
          navigation.navigate('JobDetail', { job });
        }}
        onDeclined={() => {
          if (currentOffer) putOfferAside(currentOffer);
          toast.info('The job went back to dispatch.', 'Offer declined');
        }}
        onExpired={() => {
          if (currentOffer) putOfferAside(currentOffer);
          refreshQueue();
        }}
        onDismiss={() => {
          if (currentOffer) putOfferAside(currentOffer);
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
