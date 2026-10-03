import { useEffect, useState } from 'react';
import { secondsUntil } from '../lib/countdown';

/**
 * Seconds left until `expiresAt`, re-rendering once a second. It stops ticking once the time is up
 * and when there is no deadline. `onExpire` fires once when the deadline passes.
 */
export function useCountdown(expiresAt: string | Date | null | undefined, onExpire?: () => void): number {
  const [seconds, setSeconds] = useState(() => secondsUntil(expiresAt));

  useEffect(() => {
    setSeconds(secondsUntil(expiresAt));
    if (!expiresAt) return undefined;

    let fired = false;
    const tick = () => {
      const left = secondsUntil(expiresAt);
      setSeconds(left);
      if (left <= 0) {
        clearInterval(timer);
        if (!fired) {
          fired = true;
          onExpire?.();
        }
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
    // `onExpire` is intentionally read at fire time, not a reason to restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return seconds;
}
