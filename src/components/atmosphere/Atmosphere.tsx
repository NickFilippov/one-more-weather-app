import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Condition } from '@/features/weather/types';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { SkyCanvas } from './SkyCanvas';

interface Props {
  condition: Condition;
  /** Анимируется только видимая страница при активном приложении (NFR-06). */
  active: boolean;
  children?: ReactNode;
  style?: ViewStyle;
}

/** Корневой слой страницы: градиент неба, поверх него свечение, облака и дождь на Skia. */
export function Atmosphere({ condition, active, children, style }: Props) {
  const { c } = useTheme();
  const reduceMotion = useReduceMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
  };

  return (
    <View style={[styles.root, { backgroundColor: c.skyBottom }, style]} onLayout={onLayout}>
      <LinearGradient
        colors={[c.skyTop, c.skyMid, c.skyBottom]}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />
      {size.w > 0 && (
        <SkyCanvas condition={condition} width={size.w} height={size.h} running={active && !reduceMotion} />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
});
