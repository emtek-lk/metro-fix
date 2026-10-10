import { Easing } from 'react-native';

/**
 * Motion tokens. Curves and spring settings come from one place so every control moves the same
 * way; nothing should invent its own numbers.
 */

/** Strong ease-out for anything entering, exiting or responding to a press. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** For movement that stays on screen. */
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

export const duration = {
  /** Press feedback: fast enough to read as instant. */
  press: 120,
  /** Toggles, chips and small state changes. */
  small: 180,
} as const;

/** Scale a pressed control settles at. */
export const PRESS_SCALE = 0.97;

/**
 * Apple's two designer-facing spring parameters, converted to the stiffness / damping React
 * Native's `Animated.spring` takes (unit mass).
 *
 * `dampingRatio` 1 settles with no overshoot; below 1 it bounces. Use ~0.8 only when the user's
 * gesture carried momentum (a flick or a throw); everything else stays at 1.
 * `response` is how quickly it reaches the target, in seconds (lower is snappier).
 */
export function appleSpring(response: number, dampingRatio: number) {
  const stiffness = (2 * Math.PI) ** 2 / response ** 2;
  const damping = 2 * dampingRatio * Math.sqrt(stiffness);
  return { stiffness, damping, mass: 1 } as const;
}

export const spring = {
  /** Default settle, no overshoot. */
  settle: appleSpring(0.4, 1),
  /** Sheets and drawers that were dragged or flicked. */
  sheet: appleSpring(0.3, 0.8),
} as const;
