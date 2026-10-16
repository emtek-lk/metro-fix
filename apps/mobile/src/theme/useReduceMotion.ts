import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** True when the OS asks apps to minimise motion; springs and stretching should be skipped. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      AccessibilityInfo.isReduceMotionEnabled?.()
        ?.then((enabled) => active && setReduce(enabled))
        .catch(() => undefined);
      const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduce);
      return () => {
        active = false;
        subscription?.remove?.();
      };
    } catch {
      return undefined;
    }
  }, []);

  return reduce;
}
