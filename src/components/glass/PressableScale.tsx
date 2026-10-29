import { useState, type ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { ease } from '@/theme/motion';
import { duration } from '@/theme/tokens';

interface Props {
  onPress?: () => void;
  label?: string;
  /** Сжатие до 0.97 делает JS. На Liquid Glass его делает система (isInteractive). */
  scale: boolean;
  to?: number;
  style?: ViewStyle;
  children: (pressed: boolean) => ReactNode;
}

/** Сжатие при нажатии за `tap` и отпускание пружинкой. */
export function PressableScale({ onPress, label, scale, to = 0.97, style, children }: Props) {
  const s = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const reduce = useReduceMotion();
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const animate = scale && !reduce;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        setPressed(true);
        if (animate) s.set(withTiming(to, { duration: duration.tap }));
      }}
      onPressOut={() => {
        setPressed(false);
        if (animate) s.set(withTiming(1, { duration: duration.ui, easing: ease.spring }));
      }}
      style={[{ flex: 1 }, style]}
    >
      <Animated.View style={[{ flex: 1 }, anim]}>{children(pressed)}</Animated.View>
    </Pressable>
  );
}
