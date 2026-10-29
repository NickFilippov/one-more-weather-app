import { useEffect, useState } from 'react';
import { useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { useEntrance } from '@/lib/entrance';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { duration } from '@/theme/tokens';
import { ease } from '@/theme/motion';

/**
 * Прогресс появления 0→1 с задержкой. При «Уменьшении движения» только проявление за `ui`.
 * `shown` (только при trackShown) становится true, когда задержка прошла: по нему включается Liquid Glass.
 * Под сплэшем появление ждёт, пока небо начнёт раскрываться, и сдвигается на ENTRANCE_SHIFT.
 */
export function useReveal(
  delay: number,
  enabled: boolean,
  trackShown = false,
): { p: SharedValue<number>; shown: boolean; reduce: boolean } {
  const reduce = useReduceMotion();
  const { ready, shift } = useEntrance();
  const p = useSharedValue(enabled ? 0 : 1);
  const [delayPassed, setDelayPassed] = useState(false);
  const wait = delay + shift;

  useEffect(() => {
    if (!enabled) {
      p.value = 1;
      return;
    }
    if (!ready) return;
    if (reduce) {
      p.value = withTiming(1, { duration: duration.ui });
      return;
    }
    p.value = withDelay(wait, withTiming(1, { duration: duration.reveal, easing: ease.glass }));
    if (!trackShown) return;
    const timer = setTimeout(() => setDelayPassed(true), wait);
    return () => clearTimeout(timer);
  }, [enabled, ready, wait, reduce, trackShown, p]);

  return { p, shown: !enabled || (ready && (reduce || delayPassed)), reduce };
}
