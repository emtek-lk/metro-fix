import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import type { ServiceRequest } from '@metro-fix/core-types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { realtimeSocket } from '../services/websocket';
import { statusChangeAlert } from '../lib/trackingCopy';
import { haptics } from '../lib/haptics';
import { useMyRequests, useMySubscription } from '../hooks/useJobs';
import { getErrorMessage } from '../lib/errors';
import { SubscriptionGate } from '../components/SubscriptionGate';
import { LoadingState } from '../components/ui/LoadingState';
import { CustomerBookingWizard } from '../components/CustomerBookingWizard';
import { MyRequestsScreen } from '../components/MyRequestsScreen';
import { ProfileScreen } from '../components/Profile';
import { FloatingTabBar, type TabItem } from '../components/ui/FloatingTabBar';
import { ScreenShell } from './ScreenShell';
import { TabPanes } from './TabPanes';
import type { RootStackParamList } from './types';

const CUSTOMER_TABS: TabItem[] = [
  { id: 'book', label: 'Request', icon: 'plus-circle' },
  { id: 'requests', label: 'My requests', icon: 'list' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

/** The customer's home: book a service, follow requests, and the profile. */
export function CustomerMain({ navigation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>(CUSTOMER_TABS[0].id);
  // The customer's own requests from the API, kept live by the realtime sync.
  const myRequests = useMyRequests();
  // Raising a request needs a paid plan; until they have one the Request tab explains and links to the plans.
  const subscription = useMySubscription();
  // Changing the key gives the next booking a fresh, empty wizard.
  const [bookingKey, setBookingKey] = useState(0);

  // Tell the customer in-app when one of their requests moves to a new step (push is not wired yet).
  const toast = useToast();
  const lastStatus = useRef(new Map<string, string>());
  useEffect(() => {
    (myRequests.data ?? []).forEach((job) => {
      if (!lastStatus.current.has(job.id)) lastStatus.current.set(job.id, job.status);
    });
  }, [myRequests.data]);
  useEffect(() => {
    return realtimeSocket.on('job.updated', (job: ServiceRequest) => {
      const alert = statusChangeAlert(lastStatus.current.get(job.id), job);
      lastStatus.current.set(job.id, job.status);
      if (alert) {
        haptics.success();
        toast.info(alert.message, alert.title);
      }
    });
  }, [toast]);

  // Android back: return to the first tab before leaving the app.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (activeTab !== CUSTOMER_TABS[0].id) {
          setActiveTab(CUSTOMER_TABS[0].id);
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [activeTab]),
  );

  if (!user) return null;

  const handleBookingComplete = (job: ServiceRequest) => {
    queryClient.invalidateQueries({ queryKey: ['myRequests'] });
    setBookingKey((key) => key + 1);
    navigation.navigate('Tracking', { job });
  };

  const panes: Record<string, () => React.ReactNode> = {
    book: () =>
      subscription.isLoading ? (
        <LoadingState message="Checking your plan…" />
      ) : subscription.data && !subscription.data.tier ? (
        <SubscriptionGate onViewPlans={() => navigation.navigate('Plans')} />
      ) : (
        <CustomerBookingWizard
          key={bookingKey}
          customerId={user.id}
          onBookingComplete={handleBookingComplete}
          onNeedSubscription={() => {
            subscription.refetch();
            navigation.navigate('Plans');
          }}
        />
      ),
    requests: () => (
      <MyRequestsScreen
        requests={myRequests.data ?? []}
        isLoading={myRequests.isLoading}
        errorMessage={myRequests.isError ? getErrorMessage(myRequests.error) : null}
        refreshing={myRequests.isRefetching}
        onRefresh={() => myRequests.refetch()}
        onOpen={(job) => navigation.navigate('Tracking', { job })}
        onBook={() => setActiveTab('book')}
      />
    ),
    profile: () => (
      <ProfileScreen
        onOpenGallery={__DEV__ ? () => navigation.navigate('Gallery') : undefined}
        onOpenSubscription={() => navigation.navigate('Plans')}
      />
    ),
  };

  return (
    <ScreenShell>
      <TabPanes activeTab={activeTab} panes={panes} />
      <FloatingTabBar activeTab={activeTab} onTabPress={setActiveTab} tabs={CUSTOMER_TABS} />
    </ScreenShell>
  );
}
