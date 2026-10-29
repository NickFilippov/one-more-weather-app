import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useEntrance } from '@/lib/entrance';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { ease } from '@/theme/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { duration } from '@/theme/tokens';

interface Props {
  low: number;
  high: number;
  min: number;
  max: number;
  /** Температура сейчас: только у сегодняшнего дня. */
  now?: number;
  /** Порядковый номер строки для каскада. */
  index: number;
}

/** Шкала температур: полоска дня на общей для всех дней шкале, градиент cold → warm общий. */
export function TempBar({ low, high, min, max, now, index }: Props) {
  const { c } = useTheme();
  const reduce = useReduceMotion();
  const { ready, shift } = useEntrance();
  const [w, setW] = useState(0);
  const span = Math.max(1, max - min);
  const left = (low - min) / span;
  const width = Math.max(0.06, (high - low) / span);

  const grow = useSharedValue(0);
  const pop = useSharedValue(0);
  useEffect(() => {
    if (w === 0 || !ready) return;
    if (reduce) {
      grow.value = withTiming(1, { duration: duration.ui });
      pop.value = 1;
      return;
    }
    grow.value = withDelay(index * duration.stagger + 320 + shift, withTiming(1, { duration: duration.reveal, easing: ease.spring }));
    pop.value = withDelay(700 + shift, withTiming(1, { duration: duration.ui, easing: ease.spring }));
  }, [w > 0, reduce, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const fillStyle = useAnimatedStyle(() => ({
    opacity: reduce ? grow.value : 0.4 + 0.6 * grow.value,
    transform: reduce ? [] : [{ scaleX: grow.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({ transform: reduce ? [] : [{ scale: pop.value }], opacity: reduce ? pop.value : 1 }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      style={{ flex: 1, height: 5, borderRadius: 999, backgroundColor: c.panelStrong }}
    >
      {w > 0 && (
        <Animated.View
          style={[
            { position: 'absolute', top: 0, bottom: 0, left: left * w, width: width * w, borderRadius: 999, overflow: 'hidden', transformOrigin: 'left center' },
            fillStyle,
          ]}
        >
          <LinearGradient
            colors={[c.cold, c.warm]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, bottom: 0, left: -left * w, width: w }}
          />
        </Animated.View>
      )}
      {w > 0 && now != null && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -2,
              left: ((now - min) / span) * w - 4.5,
              width: 9,
              height: 9,
              borderRadius: 4.5,
              backgroundColor: c.text,
              boxShadow: `0 0 0 2px ${c.sun}`,
            },
            dotStyle,
          ]}
        />
      )}
    </View>
  );
}
