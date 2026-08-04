import { Platform } from 'react-native';
import { LocationCoordinates } from '@metro-fix/core-types';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { apiService } from './api';
import { authStorage } from './authStorage';

interface ExpoLocationObject {
  coords: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
  };
  timestamp: number;
}

export interface WorkerLocationState {
  coordinates: LocationCoordinates;
  isTracking: boolean;
  lastUpdated: string;
}

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

// Default fallback coordinates (e.g. San Francisco Financial District / Metropolitan Center)
const DEFAULT_COORDINATES: LocationCoordinates = {
  latitude: 37.78825,
  longitude: -122.4324,
};

// Define background task outside of the React component tree
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[LocationService] Background location task error:', error.message);
    return;
  }
  if (data) {
    try {
      const { locations } = data as { locations: ExpoLocationObject[] };
      if (locations && locations.length > 0) {
        const latest = locations[locations.length - 1];
        const token = await authStorage.getToken();
        if (token) {
          await apiService.updateMyLocation(
            latest.coords.latitude,
            latest.coords.longitude,
            latest.coords.heading ?? null,
            latest.coords.speed ?? null,
          );
          console.log(
            `[LocationService] Background GPS telemetry synced: (${latest.coords.latitude.toFixed(4)}, ${latest.coords.longitude.toFixed(4)})`,
          );
        }
      }
    } catch (err) {
      console.warn('[LocationService] Error inside background task:', err);
    }
  }
});

export async function startWorkerBackgroundTracking(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('[LocationService] Web platform detected; native background TaskManager skipped.');
    return true;
  }
  try {
    const fgPerm = await Location.requestForegroundPermissionsAsync();
    if (fgPerm.status !== 'granted') {
      console.warn('[LocationService] Foreground location permission denied');
      return false;
    }

    const bgPerm = await Location.requestBackgroundPermissionsAsync();
    if (bgPerm.status !== 'granted') {
      console.warn('[LocationService] Background location permission denied');
      return false;
    }

    // Check if already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
        deferredUpdatesInterval: 10000,
        foregroundService: {
          notificationTitle: 'Metro-Fix Field Dispatch',
          notificationBody: 'Active GPS telemetry stream running on route',
        },
      });
      console.log('[LocationService] Background GPS tracking initialized');
    }

    // Immediately push one update
    try {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await apiService.updateMyLocation(
        current.coords.latitude,
        current.coords.longitude,
        current.coords.heading ?? null,
        current.coords.speed ?? null,
      );
    } catch (posErr) {
      console.warn('[LocationService] Initial foreground location ping failed:', posErr);
    }

    return true;
  } catch (error) {
    console.warn('[LocationService] Failed to start background tracking:', error);
    return false;
  }
}

export async function stopWorkerBackgroundTracking(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[LocationService] Background GPS tracking stopped (battery preserve)');
    }
  } catch (error) {
    console.warn('[LocationService] Error stopping background tracking:', error);
  }
}

export async function getCurrentWorkerLocation(): Promise<LocationCoordinates> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }
  } catch (error) {
    console.warn('[LocationService] Using fallback GPS coordinates:', error);
  }

  return DEFAULT_COORDINATES;
}

/**
 * Mock background sync function that sends periodic worker GPS coordinates to backend (for fallback/web test)
 */
export function startBackgroundLocationSync(
  workerId: string,
  onSync: (coords: LocationCoordinates) => void,
): () => void {
  console.log(`[LocationService] Started background GPS sync for worker: ${workerId}`);

  const intervalId = setInterval(async () => {
    const coords = await getCurrentWorkerLocation();
    const simulatedCoords: LocationCoordinates = {
      latitude: coords.latitude + (Math.random() - 0.5) * 0.001,
      longitude: coords.longitude + (Math.random() - 0.5) * 0.001,
    };
    onSync(simulatedCoords);
  }, 15000);

  return () => {
    console.log(`[LocationService] Stopped background GPS sync for worker: ${workerId}`);
    clearInterval(intervalId);
  };
}
