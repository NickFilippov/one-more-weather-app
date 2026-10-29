import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { Condition } from '@/features/weather/types';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { BlurTargetContext, type BlurTargetRef } from './BlurTargetContext';
import { SkyCanvas } from './SkyCanvas';

interface Props {
  condition: Condition;
  /** Анимируется только видимая страница при активном приложении (NFR-06). */
  active: boolean;
  /** Вызывается, когда страница становится активной: футер, лежащий вне неба, берёт её цель размытия. */
  onBlurTarget?: (ref: BlurTargetRef) => void;
  children?: ReactNode;
  style?: ViewStyle;
}

/**
 * Корневой слой страницы: градиент неба и живой фон. Содержимое экрана — соседи
 * BlurTargetView, а не его потомки: на Android матовое стекло размывает только цель.
 */
export function Atmosphere({ condition, active, onBlurTarget, children, style }: Props) {
  const { c } = useTheme();
  const reduceMotion = useReduceMotion();
  const targetRef = useRef<ComponentRef<typeof View>>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const running = active && !reduceMotion;

  useEffect(() => {
    if (active) onBlurTarget?.(targetRef);
  }, [active, onBlurTarget]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
  };

  return (
    <View style={[styles.root, { backgroundColor: c.skyBottom }, style]} onLayout={onLayout}>
      <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[c.skyTop, c.skyMid, c.skyBottom]}
          locations={[0, 0.38, 1]}
          style={StyleSheet.absoluteFill}
        />
      </BlurTargetView>
      {/* Холст вне цели размытия: иначе на Android каждый BlurView пересчитывает размытие на каждом
          кадре анимации неба (замер: 2.5 с на кадр в debug). Стекло размывает неподвижный градиент. */}
      {size.w > 0 && <SkyCanvas condition={condition} width={size.w} height={size.h} running={running} />}
      <BlurTargetContext.Provider value={targetRef}>{children}</BlurTargetContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
});
