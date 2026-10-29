import { useState, type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { ease } from '@/theme/motion';
import { duration } from '@/theme/tokens';

interface Props {
  onPress?: () => void;
  label?: string;
  /** Насколько сжимается при нажатии. */
  to?: number;
  style?: StyleProp<ViewStyle>;
  children: (pressed: boolean) => ReactNode;
}

/** Кнопка, которая сжимается при нажатии за `tap` и отпускается пружинкой. */
export function PressableScale({ onPress, label, to = 0.97, style, children }: Props) {
  const s = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const reduce = useReduceMotion();
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        setPressed(true);
        if (!reduce) s.set(withTiming(to, { duration: duration.tap }));
      }}
      onPressOut={() => {
        setPressed(false);
        if (!reduce) s.set(withTiming(1, { duration: duration.ui, easing: ease.spring }));
      }}
      style={[{ flexGrow: 1 }, style]}
    >
      <Animated.View style={[{ flexGrow: 1 }, anim]}>{children(pressed)}</Animated.View>
    </Pressable>
  );
}
