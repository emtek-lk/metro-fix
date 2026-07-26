import { Linking, Platform } from 'react-native';

export interface MapCoordinates {
  latitude: number;
  longitude: number;
  label?: string;
}

export async function openNativeNavigation({
  latitude,
  longitude,
  label = 'Job Site Location',
}: MapCoordinates): Promise<void> {
  const encodedLabel = encodeURIComponent(label);

  const scheme = Platform.select({
    ios: `maps://?q=${encodedLabel}&ll=${latitude},${longitude}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });

  try {
    const supported = await Linking.canOpenURL(scheme);
    if (supported) {
      await Linking.openURL(scheme);
    } else {
      // Fallback to web Google Maps
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('Error launching native maps navigation:', error);
    // Absolute fallback
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    await Linking.openURL(webUrl);
  }
}
