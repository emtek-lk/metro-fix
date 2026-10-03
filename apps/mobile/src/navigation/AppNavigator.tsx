import React from 'react';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Role } from '@metro-fix/core-types';
import { useAuth } from '../context/AuthContext';
import { MobileLoginScreen } from '../components/MobileLoginScreen';
import { RegisterScreen } from '../components/RegisterScreen';
import { JobDetail } from '../components/JobDetail';
import { CustomerTrackingView } from '../components/CustomerTrackingView';
import { UiGalleryScreen } from '../components/UiGalleryScreen';
import { UnsupportedRoleScreen } from '../components/UnsupportedRoleScreen';
import { LoadingState } from '../components/ui/LoadingState';
import { colors } from '../theme/colors';
import { ScreenShell } from './ScreenShell';
import { WorkerMain } from './WorkerMain';
import { CustomerMain } from './CustomerMain';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props<Name extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, Name>;

// Screens draw their own headers, so the native header is off. Each screen paints its own opaque
// background (see ScreenShell); the stack's own is only visible for a frame during a transition.
const screenOptions = (): NativeStackNavigationOptions => ({
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  // On iOS, let a swipe from anywhere on the screen go back, not just from the left edge.
  fullScreenGestureEnabled: true,
});

function LoginRoute({ navigation }: Props<'Login'>) {
  return (
    <ScreenShell safeArea={false}>
      <MobileLoginScreen onRegister={() => navigation.navigate('Register')} />
    </ScreenShell>
  );
}

function RegisterRoute({ navigation }: Props<'Register'>) {
  return (
    <ScreenShell safeArea={false}>
      <RegisterScreen onBack={() => navigation.goBack()} />
    </ScreenShell>
  );
}

function JobDetailRoute({ navigation, route }: Props<'JobDetail'>) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    // Edge to edge: the hero runs under the status bar and JobDetail manages its own insets.
    <ScreenShell safeArea={false}>
      <JobDetail
        job={route.params.job}
        workerId={user.id}
        onBack={() => navigation.goBack()}
        onJobUpdated={(job) => navigation.setParams({ job })}
      />
    </ScreenShell>
  );
}

function TrackingRoute({ navigation, route }: Props<'Tracking'>) {
  return (
    <ScreenShell>
      <CustomerTrackingView
        job={route.params.job}
        onBack={() => navigation.goBack()}
        // Back to the booking tab (the wizard was already reset when this request was raised).
        onNewBooking={() => navigation.popToTop()}
      />
    </ScreenShell>
  );
}

function GalleryRoute({ navigation }: Props<'Gallery'>) {
  return (
    <ScreenShell>
      <UiGalleryScreen onClose={() => navigation.goBack()} />
    </ScreenShell>
  );
}

function UnsupportedRoute() {
  const { user } = useAuth();
  return (
    <ScreenShell>
      <UnsupportedRoleScreen role={user?.role ?? ''} />
    </ScreenShell>
  );
}

/**
 * The app's screens, chosen by who is signed in. Each signed-in account gets its own navigator
 * (keyed by user), so switching accounts starts from a clean stack and never leaks the previous
 * account's screens or state.
 */
export function AppNavigator() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <ScreenShell>
        <LoadingState message="Preparing your workspace…" />
      </ScreenShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Stack.Navigator key="signed-out" screenOptions={screenOptions}>
        <Stack.Screen name="Login" component={LoginRoute} />
        <Stack.Screen name="Register" component={RegisterRoute} />
      </Stack.Navigator>
    );
  }

  // Each account sees only its own app. Admin / customer-care accounts work from the web dashboard.
  if (user.role === Role.WORKER) {
    return (
      <Stack.Navigator key={`worker-${user.id}`} screenOptions={screenOptions}>
        <Stack.Screen name="Main" component={WorkerMain} />
        <Stack.Screen name="JobDetail" component={JobDetailRoute} />
        {__DEV__ ? <Stack.Screen name="Gallery" component={GalleryRoute} /> : null}
      </Stack.Navigator>
    );
  }

  if (user.role === Role.CUSTOMER) {
    return (
      <Stack.Navigator key={`customer-${user.id}`} screenOptions={screenOptions}>
        <Stack.Screen name="Main" component={CustomerMain} />
        <Stack.Screen name="Tracking" component={TrackingRoute} />
        {__DEV__ ? <Stack.Screen name="Gallery" component={GalleryRoute} /> : null}
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator key="unsupported" screenOptions={screenOptions}>
      <Stack.Screen name="Unsupported" component={UnsupportedRoute} />
    </Stack.Navigator>
  );
}
