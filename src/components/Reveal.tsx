import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useEntrance } from '@/lib/entrance';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { ease } from '@/theme/motion';
import { duration } from '@/theme/tokens';

interface Props {
  /** Задержка появления, мс: из неё складывается каскад. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: ViewProps['pointerEvents'];
  children: ReactNode;
}

/**
 * Появление блока: снизу на 12 pt с проявлением; при «Уменьшении движения» только проявление.
 * Под сплэшем ждёт, пока небо начнёт раскрываться, и сдвигается на ENTRANCE_SHIFT.
 */
export function Reveal({ delay = 0, style, pointerEvents, children }: Props) {
  const reduce = useReduceMotion();
  const { ready, shift } = useEntrance();
  const p = useSharedValue(0);
  const wait = delay + shift;

  useEffect(() => {
    if (!ready) return;
    p.value = reduce
      ? withTiming(1, { duration: duration.ui })
      : withDelay(wait, withTiming(1, { duration: duration.reveal, easing: ease.out }));
  }, [ready, reduce, wait, p]);

  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: reduce ? [] : [{ translateY: (1 - p.value) * 12 }, { scale: 0.985 + 0.015 * p.value }],
  }));

  return (
    <Animated.View style={[style, anim]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
}
