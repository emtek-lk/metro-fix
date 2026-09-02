import type { ViewStyle } from 'react-native';

/**
 * Elevation scale. Each level pairs an iOS shadow with a matching Android
 * `elevation`, so surfaces read consistently on both platforms.
 *
 *  e0 — flat / inset
 *  e1 — list cards
 *  e2 — raised & hero cards
 *  e3 — floating tab bar, modals
 */
export const elevation = {
  e0: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  e1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  e2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  e3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 12,
  },
} as const satisfies Record<string, ViewStyle>;

export type ElevationToken = keyof typeof elevation;
