import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
  type WithTimingConfig,
} from 'react-native-reanimated';

interface LoopOptions {
  /** Туда и обратно (true) или заново с нуля (false). */
  reverse?: boolean;
  easing?: WithTimingConfig['easing'];
  /** Стартовое значение 0..1, чтобы соседние элементы шли не в такт. */
  phase?: number;
}

/**
 * Бесконечный цикл 0→1. При running=false замирает на текущем значении.
 */
export function useLoopValue(running: boolean, durationMs: number, opts: LoopOptions = {}): SharedValue<number> {
  const { reverse = false, easing = Easing.linear, phase = 0 } = opts;
  const v = useSharedValue(phase);
  useEffect(() => {
    if (!running) {
      cancelAnimation(v);
      return;
    }
    v.value = withRepeat(withTiming(1, { duration: durationMs, easing }), -1, reverse);
    return () => cancelAnimation(v);
  }, [running, durationMs, reverse, easing, v]);
  return v;
}
