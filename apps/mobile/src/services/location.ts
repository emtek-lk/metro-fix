import { LocationCoordinates } from '@metro-fix/core-types';

export interface WorkerLocationState {
  coordinates: LocationCoordinates;
  isTracking: boolean;
  lastUpdated: string;
}

// Default fallback coordinates (e.g. San Francisco Financial District / Metropolitan Center)
const DEFAULT_COORDINATES: LocationCoordinates = {
  latitude: 37.78825,
  longitude: -122.4324,
};

export async function getCurrentWorkerLocation(): Promise<LocationCoordinates> {
  try {
    // Attempt dynamic import of expo-location if available in environment
    const Location = await import('expo-location').catch(() => null);
    if (Location && Location.requestForegroundPermissionsAsync) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
    }
  } catch (error) {
    console.warn('[LocationService] Using fallback GPS coordinates:', error);
  }

  return DEFAULT_COORDINATES;
}

/**
 * Mock background sync function that sends periodic worker GPS coordinates to backend
 */
export function startBackgroundLocationSync(
  workerId: string,
  onSync: (coords: LocationCoordinates) => void,
): () => void {
  console.log(`[LocationService] Started background GPS sync for worker: ${workerId}`);
  
  const intervalId = setInterval(async () => {
    const coords = await getCurrentWorkerLocation();
    // Simulate slight movement drift for real-time GPS simulation
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
