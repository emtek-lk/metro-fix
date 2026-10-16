/**
 * Pure geometry for the sliding tab "bubble": every function works in the coordinate space of
 * the tab track (0 = its left padding edge), so it can be tested without any rendering. Every
 * function is a worklet: the tab bar's gesture calls them on the UI thread.
 */

export interface TrackGeometry {
  /** Total width available to the tabs (the track minus its horizontal padding). */
  innerWidth: number;
  count: number;
}

export function tabWidth({ innerWidth, count }: TrackGeometry): number {
  'worklet';
  return count > 0 ? innerWidth / count : 0;
}

/** Index of the tab under `x`, clamped so touches past either edge select the first / last tab. */
export function tabIndexAt(x: number, geometry: TrackGeometry): number {
  'worklet';
  const width = tabWidth(geometry);
  if (width <= 0) return 0;
  const index = Math.floor(x / width);
  return Math.min(Math.max(index, 0), geometry.count - 1);
}

/** Left edge of tab `index`. */
export function tabLeft(index: number, geometry: TrackGeometry): number {
  'worklet';
  return index * tabWidth(geometry);
}

/**
 * Left edge of a bubble centred on a finger at `x`, clamped so the bubble never leaves the track.
 */
export function bubbleLeftForFinger(x: number, geometry: TrackGeometry): number {
  'worklet';
  const width = tabWidth(geometry);
  const max = Math.max(geometry.innerWidth - width, 0);
  return Math.min(Math.max(x - width / 2, 0), max);
}

/** How much the bubble stretches horizontally at a given finger speed (px/ms), 0 → `max`. */
export function stretchForVelocity(velocityX: number, max = 0.28): number {
  'worklet';
  return Math.min(Math.abs(velocityX) * 0.45, max);
}
