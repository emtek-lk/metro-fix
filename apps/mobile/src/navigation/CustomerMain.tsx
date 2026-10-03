import React, { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import type { ServiceRequest } from '@metro-fix/core-types';
import { useAuth } from '../context/AuthContext';
import { useMyRequests } from '../hooks/useJobs';
import { getErrorMessage } from '../lib/errors';
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
  // Changing the key gives the next booking a fresh, empty wizard.
  const [bookingKey, setBookingKey] = useState(0);

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
    book: () => (
      <CustomerBookingWizard
        key={bookingKey}
        customerId={user.id}
        onBookingComplete={handleBookingComplete}
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
      <ProfileScreen onOpenGallery={__DEV__ ? () => navigation.navigate('Gallery') : undefined} />
    ),
  };

  return (
    <ScreenShell>
      <TabPanes activeTab={activeTab} panes={panes} />
      <FloatingTabBar activeTab={activeTab} onTabPress={setActiveTab} tabs={CUSTOMER_TABS} />
    </ScreenShell>
  );
}
