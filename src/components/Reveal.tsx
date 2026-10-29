import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReveal } from './glass/useReveal';

interface Props {
  delay?: number;
  style?: ViewStyle;
  children: ReactNode;
}

/** Появление блока: снизу на 12 pt с проявлением; при «Уменьшении движения» только проявление. */
export function Reveal({ delay = 0, style, children }: Props) {
  const { p, reduce } = useReveal(delay, true);
  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: reduce ? [] : [{ translateY: (1 - p.value) * 12 }, { scale: 0.985 + 0.015 * p.value }],
  }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
